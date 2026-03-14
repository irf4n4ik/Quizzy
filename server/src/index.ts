import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import {
  Prisma,
  QuestionType,
  RoomStatus,
  UserRole,
  type GameRoom,
  type RoomParticipant,
} from "@prisma/client";
import { z } from "zod";
import { comparePassword, getTokenFromRequest, hashPassword, signToken, verifyToken, type AuthUser } from "./lib/auth.js";
import { config, questionUploadsDir } from "./lib/config.js";
import { prisma } from "./lib/prisma.js";
import { toClientQuiz, toClientUser, toRoomState } from "./lib/serializers.js";

fs.mkdirSync(questionUploadsDir, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.clientOrigins,
    credentials: true,
  },
});

app.use(
  cors({
    origin: config.clientOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(config.uploadsRoot));

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, questionUploadsDir),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname || "") || ".bin";
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`);
  },
});

const upload = multer({ storage });

type RequestWithUser = Request & { authUser: AuthUser };

type RoomEventSession = {
  roomId: string;
  participantId?: string;
  isHost: boolean;
};

const roomTimers = new Map<string, NodeJS.Timeout>();
const socketSessions = new Map<string, RoomEventSession>();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(60),
  email: z.string().trim().email("Некорректный e-mail"),
  password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
  role: z.enum(["player", "organizer"]),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  role: z.enum(["player", "organizer"]).optional(),
});

const answerInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Заполните текст ответа"),
  isCorrect: z.boolean(),
});

const questionInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, "Введите текст вопроса"),
  imageUrl: z.string().optional(),
  multipleChoice: z.boolean(),
  timeLimit: z.number().int().min(5).max(180),
  points: z.number().int().min(10).max(5000),
  answers: z.array(answerInputSchema).min(2).max(6),
});

const quizInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(500),
  category: z.string().trim().min(2).max(80),
  timePerQuestion: z.number().int().min(5).max(180),
  questions: z.array(questionInputSchema),
});

function asyncHandler<T extends Request>(
  handler: (request: T, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: T, response: Response, next: NextFunction) => {
    handler(request, response, next).catch(next);
  };
}

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = getTokenFromRequest(request);
  if (!token) {
    next(createHttpError(401, "Требуется авторизация."));
    return;
  }

  try {
    (request as RequestWithUser).authUser = verifyToken(token);
    next();
  } catch {
    next(createHttpError(401, "Сессия недействительна."));
  }
}

function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const authUser = (request as RequestWithUser).authUser;
    if (authUser.role !== role) {
      next(createHttpError(403, "Недостаточно прав."));
      return;
    }
    next();
  };
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

async function getRoomWithRelations(roomId: string) {
  return prisma.gameRoom.findUnique({
    where: { id: roomId },
    include: {
      host: true,
      quiz: {
        include: {
          questions: {
            include: {
              answers: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      participants: true,
      answers: true,
    },
  });
}

async function emitRoomState(roomId: string) {
  const room = await getRoomWithRelations(roomId);
  if (!room) return;

  const hostState = toRoomState(room, "host", room.hostId);
  const playerSockets = Array.from(io.sockets.adapter.rooms.get(roomId) ?? []);

  for (const socketId of playerSockets) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) continue;
    const session = socketSessions.get(socketId);
    if (session?.isHost) {
      socket.emit("room:state", hostState);
      continue;
    }

    const participant = room.participants.find((item) => item.id === session?.participantId);
    const viewerUserId = participant?.userId ?? undefined;
    socket.emit("room:state", toRoomState(room, "player", viewerUserId));
  }
}

function scheduleQuestionEnd(room: GameRoom) {
  const existing = roomTimers.get(room.id);
  if (existing) clearTimeout(existing);
  if (!room.currentQuestionEndsAt) return;

  const timeout = Math.max(0, room.currentQuestionEndsAt.getTime() - Date.now());
  const timer = setTimeout(async () => {
    const latestRoom = await getRoomWithRelations(room.id);
    if (!latestRoom || latestRoom.status !== RoomStatus.PLAYING) return;
    io.to(room.id).emit("question:ended", {
      roomId: room.id,
      questionId:
        latestRoom.currentQuestionIndex >= 0
          ? latestRoom.quiz.questions[latestRoom.currentQuestionIndex]?.id
          : null,
      endedAt: Date.now(),
    });
    await emitRoomState(room.id);
  }, timeout);

  roomTimers.set(room.id, timer);
}

function calculatePoints(questionPoints: number, questionTimeLimitSeconds: number, timeSpentMs: number) {
  const remainingSeconds = Math.max(0, questionTimeLimitSeconds - Math.floor(timeSpentMs / 1000));
  return questionPoints + remainingSeconds * 5;
}

async function createOrReplaceQuiz(authorId: string, payload: z.infer<typeof quizInputSchema>, quizId?: string) {
  const questionData = payload.questions.map((question, questionIndex) => ({
    ...(question.id ? { id: question.id } : {}),
    order: questionIndex,
    text: question.text,
    imagePath: question.imageUrl ? question.imageUrl.replace(/^\/uploads\//, "") : null,
    type: question.multipleChoice ? QuestionType.MULTIPLE : QuestionType.SINGLE,
    timeLimit: question.timeLimit,
    points: question.points,
    answers: {
      create: question.answers.map((answer, answerIndex) => ({
        ...(answer.id ? { id: answer.id } : {}),
        order: answerIndex,
        text: answer.text,
        isCorrect: answer.isCorrect,
      })),
    },
  }));

  if (!quizId) {
    return prisma.quiz.create({
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        defaultTimePerQuestion: payload.timePerQuestion,
        authorId,
        questions: {
          create: questionData,
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!existing || existing.authorId !== authorId) {
      throw createHttpError(404, "Викторина не найдена.");
    }

    await transaction.answerOption.deleteMany({
      where: {
        question: {
          quizId,
        },
      },
    });
    await transaction.question.deleteMany({ where: { quizId } });

    return transaction.quiz.update({
      where: { id: quizId },
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        defaultTimePerQuestion: payload.timePerQuestion,
        questions: {
          create: questionData,
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
  });
}

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post(
  "/auth/register",
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (existing) {
      throw createHttpError(409, "Пользователь с таким e-mail уже существует.");
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        passwordHash: await hashPassword(payload.password),
        role: payload.role === "organizer" ? UserRole.ORGANIZER : UserRole.PLAYER,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    response.status(201).json({
      token: signToken(authUser),
      user: toClientUser(user),
    });
  }),
);

app.post(
  "/auth/login",
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    if (!user || !(await comparePassword(payload.password, user.passwordHash))) {
      throw createHttpError(401, "Неверный e-mail или пароль.");
    }
    if (
      payload.role &&
      ((payload.role === "organizer" && user.role !== UserRole.ORGANIZER) ||
        (payload.role === "player" && user.role !== UserRole.PLAYER))
    ) {
      throw createHttpError(403, "Выбранная роль не совпадает с зарегистрированной.");
    }

    response.json({
      token: signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      }),
      user: toClientUser(user),
    });
  }),
);

app.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) {
      throw createHttpError(404, "Пользователь не найден.");
    }
    response.json({ user: toClientUser(user) });
  }),
);

app.post("/auth/logout", requireAuth, (_request, response) => {
  response.json({ ok: true });
});

app.get(
  "/quizzes/my",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const quizzes = await prisma.quiz.findMany({
      where: { authorId: authUser.id },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    response.json({ quizzes: quizzes.map(toClientQuiz) });
  }),
);

app.post(
  "/quizzes",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const payload = quizInputSchema.parse(request.body);
    const quiz = await createOrReplaceQuiz(authUser.id, payload);
    response.status(201).json({ quiz: toClientQuiz(quiz) });
  }),
);

app.get(
  "/quizzes/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const quizId = String(request.params.id);
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        authorId: authUser.id,
      },
      include: {
        questions: {
          include: { answers: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      throw createHttpError(404, "Викторина не найдена.");
    }

    response.json({ quiz: toClientQuiz(quiz) });
  }),
);

app.patch(
  "/quizzes/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const payload = quizInputSchema.parse(request.body);
    const quiz = await createOrReplaceQuiz(authUser.id, payload, String(request.params.id));
    response.json({ quiz: toClientQuiz(quiz) });
  }),
);

app.delete(
  "/quizzes/:id",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const quizId = String(request.params.id);
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, authorId: authUser.id },
    });
    if (!quiz) {
      throw createHttpError(404, "Викторина не найдена.");
    }
    await prisma.quiz.delete({ where: { id: quiz.id } });
    response.json({ ok: true });
  }),
);

app.post(
  "/quizzes/:id/questions/:questionId/image",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  upload.single("image"),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const file = request.file;
    const quizId = String(request.params.id);
    const questionId = String(request.params.questionId);
    if (!file) {
      throw createHttpError(400, "Файл изображения не получен.");
    }

    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        quizId,
        quiz: {
          authorId: authUser.id,
        },
      },
    });

    if (!question) {
      throw createHttpError(404, "Вопрос не найден.");
    }

    const relativePath = path.posix.join("questions", file.filename);
    await prisma.question.update({
      where: { id: question.id },
      data: { imagePath: relativePath },
    });

    response.status(201).json({
      imageUrl: `/uploads/${relativePath}`,
    });
  }),
);

app.post(
  "/rooms",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const payload = z.object({ quizId: z.string().min(1) }).parse(request.body);

    const quiz = await prisma.quiz.findFirst({
      where: { id: payload.quizId, authorId: authUser.id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw createHttpError(404, "Викторина не найдена.");
    }
    if (quiz.questions.length === 0) {
      throw createHttpError(400, "Нельзя запустить комнату без вопросов.");
    }

    let code = generateRoomCode();
    while (await prisma.gameRoom.findUnique({ where: { code } })) {
      code = generateRoomCode();
    }

    const room = await prisma.gameRoom.create({
      data: {
        code,
        quizId: quiz.id,
        hostId: authUser.id,
      },
      include: {
        host: true,
        quiz: {
          include: {
            questions: {
              include: { answers: true },
              orderBy: { order: "asc" },
            },
          },
        },
        participants: true,
        answers: true,
      },
    });

    response.status(201).json({
      room: toRoomState(room, "host", authUser.id),
    });
  }),
);

app.get(
  "/rooms/by-code/:code",
  requireAuth,
  asyncHandler(async (request, response) => {
    const roomCode = String(request.params.code).toUpperCase();
    const room = await prisma.gameRoom.findUnique({
      where: { code: roomCode },
      include: {
        host: true,
        quiz: {
          include: {
            questions: {
              include: { answers: true },
              orderBy: { order: "asc" },
            },
          },
        },
        participants: true,
        answers: true,
      },
    });

    if (!room) {
      throw createHttpError(404, "Комната не найдена.");
    }

    response.json({
      room: toRoomState(room, "player", (request as RequestWithUser).authUser.id),
    });
  }),
);

app.get(
  "/rooms/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const room = await getRoomWithRelations(String(request.params.id));
    if (!room) {
      throw createHttpError(404, "Комната не найдена.");
    }

    const participant = room.participants.find((item) => item.userId === authUser.id);
    const isHost = room.hostId === authUser.id;
    if (!isHost && !participant) {
      throw createHttpError(403, "Нет доступа к этой комнате.");
    }

    response.json({
      room: toRoomState(room, isHost ? "host" : "player", authUser.id),
    });
  }),
);

app.get(
  "/dashboard/player",
  requireAuth,
  requireRole(UserRole.PLAYER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;
    const participations = await prisma.roomParticipant.findMany({
      where: {
        userId: authUser.id,
        room: {
          status: RoomStatus.FINISHED,
        },
      },
      include: {
        room: {
          include: {
            quiz: true,
            participants: true,
          },
        },
      },
      orderBy: {
        room: {
          finishedAt: "desc",
        },
      },
    });

    const history = participations.map((participation) => {
      const sorted = [...participation.room.participants].sort(
        (left, right) => right.finalScore - left.finalScore || right.correctAnswers - left.correctAnswers,
      );
      const rank = sorted.findIndex((item) => item.id === participation.id) + 1;
      return {
        id: participation.id,
        userId: authUser.id,
        quizId: participation.room.quizId,
        quizTitle: participation.room.quiz.title,
        roomCode: participation.room.code,
        date: participation.room.finishedAt?.getTime() ?? participation.room.createdAt.getTime(),
        playerCount: participation.room.participants.length,
        role: "player",
        score: participation.finalScore,
        rank,
      };
    });

    const totalScore = history.reduce((sum, item) => sum + (item.score ?? 0), 0);
    response.json({
      stats: {
        totalGames: history.length,
        wins: history.filter((item) => item.rank === 1).length,
        totalScore,
        averageScore: history.length > 0 ? Math.round(totalScore / history.length) : 0,
      },
      history,
    });
  }),
);

app.get(
  "/dashboard/organizer",
  requireAuth,
  requireRole(UserRole.ORGANIZER),
  asyncHandler(async (request, response) => {
    const authUser = (request as RequestWithUser).authUser;

    const [quizzes, rooms] = await Promise.all([
      prisma.quiz.findMany({
        where: { authorId: authUser.id },
        include: {
          questions: {
            include: { answers: true },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gameRoom.findMany({
        where: {
          hostId: authUser.id,
          status: RoomStatus.FINISHED,
        },
        include: {
          quiz: true,
          participants: true,
        },
        orderBy: { finishedAt: "desc" },
      }),
    ]);

    const history = rooms.map((room) => ({
      id: room.id,
      userId: authUser.id,
      quizId: room.quizId,
      quizTitle: room.quiz.title,
      roomCode: room.code,
      date: room.finishedAt?.getTime() ?? room.createdAt.getTime(),
      playerCount: room.participants.length,
      role: "host",
    }));

    const totalPlayers = history.reduce((sum, item) => sum + item.playerCount, 0);

    response.json({
      stats: {
        totalQuizzes: quizzes.length,
        hostedGames: history.length,
        totalPlayers,
        averagePlayers: history.length > 0 ? Math.round(totalPlayers / history.length) : 0,
      },
      quizzes: quizzes.map(toClientQuiz),
      history,
    });
  }),
);

io.use((socket, next) => {
  try {
    const token = typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : "";
    if (!token) {
      next(new Error("Требуется авторизация сокета."));
      return;
    }
    const authUser = verifyToken(token);
    socket.data.authUser = authUser;
    next();
  } catch {
    next(new Error("Не удалось авторизовать сокет."));
  }
});

io.on("connection", (socket) => {
  const authUser = socket.data.authUser as AuthUser;

  socket.on("room:join", async (payload: { roomId?: string; roomCode?: string; displayName?: string }, callback?: (response: unknown) => void) => {
    try {
      let room = payload.roomId
        ? await getRoomWithRelations(payload.roomId)
        : payload.roomCode
          ? await prisma.gameRoom.findUnique({
              where: { code: payload.roomCode.toUpperCase() },
              include: {
                host: true,
                quiz: {
                  include: {
                    questions: {
                      include: { answers: true },
                      orderBy: { order: "asc" },
                    },
                  },
                },
                participants: true,
                answers: true,
              },
            })
          : null;

      if (!room) {
        throw createHttpError(404, "Комната не найдена.");
      }

      socket.join(room.id);

      if (room.hostId === authUser.id) {
        socketSessions.set(socket.id, { roomId: room.id, isHost: true });
        socket.emit("room:state", toRoomState(room, "host", authUser.id));
        callback?.({ ok: true });
        return;
      }

      if (authUser.role !== UserRole.PLAYER) {
        throw createHttpError(403, "Организатор не может войти в комнату как игрок.");
      }
      if (room.status === RoomStatus.FINISHED) {
        throw createHttpError(400, "Комната уже завершена.");
      }

      const displayName = (payload.displayName?.trim() || authUser.name).trim();
      if (!displayName) {
        throw createHttpError(400, "Введите имя игрока.");
      }

      let participant = room.participants.find((item) => item.userId === authUser.id);
      if (participant) {
        participant = await prisma.roomParticipant.update({
          where: { id: participant.id },
          data: { connected: true, displayName },
        });
      } else {
        participant = await prisma.roomParticipant.create({
          data: {
            roomId: room.id,
            userId: authUser.id,
            displayName,
            connected: true,
          },
        });
      }

      socketSessions.set(socket.id, { roomId: room.id, participantId: participant.id, isHost: false });
      room = await getRoomWithRelations(room.id);
      if (!room) {
        throw createHttpError(404, "Комната не найдена.");
      }
      io.to(room.id).emit("room:lobby-updated", {
        roomId: room.id,
        playersCount: room.participants.length,
      });
      await emitRoomState(room.id);
      callback?.({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка входа в комнату.";
      socket.emit("room:error", { message });
      callback?.({ ok: false, message });
    }
  });

  socket.on("room:leave", async () => {
    const session = socketSessions.get(socket.id);
    if (!session) return;
    socket.leave(session.roomId);
    if (session.participantId) {
      await prisma.roomParticipant.update({
        where: { id: session.participantId },
        data: { connected: false },
      });
      await emitRoomState(session.roomId);
    }
    socketSessions.delete(socket.id);
  });

  socket.on("room:start", async (payload: { roomId: string }) => {
    const room = await getRoomWithRelations(payload.roomId);
    if (!room || room.hostId !== authUser.id) {
      socket.emit("room:error", { message: "Нет доступа к запуску комнаты." });
      return;
    }
    if (room.participants.length === 0) {
      socket.emit("room:error", { message: "В комнате пока нет игроков." });
      return;
    }
    const question = room.quiz.questions[0];
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + question.timeLimit * 1000);

    const updatedRoom = await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        status: RoomStatus.PLAYING,
        currentQuestionIndex: 0,
        startedAt,
        currentQuestionStartedAt: startedAt,
        currentQuestionEndsAt: endsAt,
      },
    });

    scheduleQuestionEnd(updatedRoom);
    io.to(room.id).emit("question:started", {
      roomId: room.id,
      questionId: question.id,
      startedAt: startedAt.getTime(),
      endsAt: endsAt.getTime(),
    });
    await emitRoomState(room.id);
  });

  socket.on("room:next-question", async (payload: { roomId: string }) => {
    const room = await getRoomWithRelations(payload.roomId);
    if (!room || room.hostId !== authUser.id) {
      socket.emit("room:error", { message: "Нет доступа к управлению комнатой." });
      return;
    }

    const nextIndex = room.currentQuestionIndex + 1;
    if (nextIndex >= room.quiz.questions.length) {
      io.to(room.id).emit("room:error", { message: "Это был последний вопрос." });
      return;
    }

    const nextQuestion = room.quiz.questions[nextIndex];
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + nextQuestion.timeLimit * 1000);

    const updatedRoom = await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        currentQuestionIndex: nextIndex,
        currentQuestionStartedAt: startedAt,
        currentQuestionEndsAt: endsAt,
      },
    });

    scheduleQuestionEnd(updatedRoom);
    io.to(room.id).emit("question:started", {
      roomId: room.id,
      questionId: nextQuestion.id,
      startedAt: startedAt.getTime(),
      endsAt: endsAt.getTime(),
    });
    await emitRoomState(room.id);
  });

  socket.on("room:end", async (payload: { roomId: string }) => {
    const room = await getRoomWithRelations(payload.roomId);
    if (!room || room.hostId !== authUser.id) {
      socket.emit("room:error", { message: "Нет доступа к завершению комнаты." });
      return;
    }

    const updatedRoom = await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        status: RoomStatus.FINISHED,
        finishedAt: new Date(),
        currentQuestionEndsAt: null,
        currentQuestionStartedAt: null,
      },
    });

    const existingTimer = roomTimers.get(room.id);
    if (existingTimer) clearTimeout(existingTimer);
    roomTimers.delete(room.id);
    io.to(room.id).emit("room:finished", {
      roomId: room.id,
      finishedAt: updatedRoom.finishedAt?.getTime() ?? Date.now(),
    });
    await emitRoomState(room.id);
  });

  socket.on(
    "room:submit-answer",
    async (
      payload: { roomId: string; questionId: string; selectedAnswerIds: string[] },
      callback?: (response: { ok: boolean; message?: string; isCorrect?: boolean; pointsEarned?: number }) => void,
    ) => {
      try {
        const session = socketSessions.get(socket.id);
        if (!session?.participantId) {
          throw createHttpError(400, "Игрок не найден в комнате.");
        }

        const room = await getRoomWithRelations(payload.roomId);
        if (!room || room.status !== RoomStatus.PLAYING) {
          throw createHttpError(400, "Комната сейчас не принимает ответы.");
        }

        const question = room.quiz.questions[room.currentQuestionIndex];
        if (!question || question.id !== payload.questionId) {
          throw createHttpError(400, "Активный вопрос уже изменился.");
        }
        if (!room.currentQuestionStartedAt || !room.currentQuestionEndsAt) {
          throw createHttpError(400, "Таймер вопроса недоступен.");
        }
        if (Date.now() > room.currentQuestionEndsAt.getTime()) {
          throw createHttpError(400, "Время на ответ уже вышло.");
        }

        const existingAnswer = await prisma.roomAnswer.findFirst({
          where: {
            roomId: room.id,
            questionId: question.id,
            participantId: session.participantId,
          },
        });
        if (existingAnswer) {
          throw createHttpError(400, "Ответ на этот вопрос уже отправлен.");
        }

        const correctIds = question.answers
          .filter((answer) => answer.isCorrect)
          .map((answer) => answer.id)
          .sort();
        const selectedIds = [...new Set(payload.selectedAnswerIds)].sort();
        const isCorrect =
          correctIds.length === selectedIds.length &&
          correctIds.every((answerId, index) => answerId === selectedIds[index]);
        const timeSpentMs = Math.max(0, Date.now() - room.currentQuestionStartedAt.getTime());
        const pointsEarned = isCorrect ? calculatePoints(question.points, question.timeLimit, timeSpentMs) : 0;

        await prisma.$transaction([
          prisma.roomAnswer.create({
            data: {
              roomId: room.id,
              questionId: question.id,
              participantId: session.participantId,
              selectedOptionIds: selectedIds,
              isCorrect,
              timeSpentMs,
              pointsEarned,
            },
          }),
          prisma.roomParticipant.update({
            where: { id: session.participantId },
            data: {
              finalScore: {
                increment: pointsEarned,
              },
              correctAnswers: {
                increment: isCorrect ? 1 : 0,
              },
            },
          }),
        ]);

        const updatedRoom = await getRoomWithRelations(room.id);
        if (updatedRoom) {
          io.to(room.id).emit("leaderboard:updated", {
            roomId: room.id,
            players: updatedRoom.participants
              .map((participant) => ({
                id: participant.id,
                name: participant.displayName,
                score: participant.finalScore,
              }))
              .sort((left, right) => right.score - left.score),
          });
          await emitRoomState(room.id);
        }

        callback?.({ ok: true, isCorrect, pointsEarned });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось отправить ответ.";
        socket.emit("room:error", { message });
        callback?.({ ok: false, message });
      }
    },
  );

  socket.on("disconnect", async () => {
    const session = socketSessions.get(socket.id);
    if (!session) return;
    if (session.participantId) {
      await prisma.roomParticipant.update({
        where: { id: session.participantId },
        data: { connected: false },
      });
      await emitRoomState(session.roomId);
    }
    socketSessions.delete(socket.id);
  });
});

app.use((error: Error & { status?: number }, _request: Request, response: Response, _next: NextFunction) => {
  const status = error.status ?? 500;
  response.status(status).json({
    error: error.message || "Внутренняя ошибка сервера.",
  });
});

server.listen(config.port, () => {
  console.log(`Quizzy API started on port ${config.port}`);
});

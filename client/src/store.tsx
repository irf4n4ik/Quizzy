import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import type {
  OrganizerStats,
  PlayerStats,
  Quiz,
  QuizHistory,
  RoomState,
  User,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_URL;
const AUTH_STORAGE_KEY = "quizzy:auth-token";
const ROOM_STORAGE_KEY = "quizzy:active-room";

type RoomSession = {
  roomId: string;
};

type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

type Action =
  | { type: "ADD_QUIZ"; payload: Quiz }
  | { type: "UPDATE_QUIZ"; payload: Quiz }
  | { type: "DELETE_QUIZ"; payload: string }
  | { type: "SET_CURRENT_ROOM"; payload: RoomState | null }
  | { type: "START_GAME" }
  | { type: "NEXT_QUESTION" }
  | { type: "END_GAME" }
  | { type: "SUBMIT_ANSWER"; payload: { questionId: string; selectedAnswerIds: string[] } };

interface AppState {
  user: User | null;
  authReady: boolean;
  quizzes: Quiz[];
  history: QuizHistory[];
  currentRoom: RoomState | null;
  rooms: RoomState[];
  playerStats: PlayerStats | null;
  organizerStats: OrganizerStats | null;
}

interface AppContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  submitAnswer: (questionId: string, selectedAnswerIds: string[]) => Promise<{ ok: true; isCorrect: boolean; pointsEarned: number }>;
  login: (email: string, password: string, role?: "player" | "organizer") => Promise<AuthResult>;
  register: (name: string, email: string, password: string, role: "player" | "organizer") => Promise<AuthResult>;
  logout: () => Promise<void>;
  createQuiz: (quiz: Quiz) => Promise<Quiz>;
  updateQuiz: (quiz: Quiz) => Promise<Quiz>;
  deleteQuiz: (quizId: string) => Promise<void>;
  uploadQuestionImage: (quizId: string, questionId: string, file: File) => Promise<string>;
  createRoom: (quizId: string) => Promise<RoomState>;
  joinRoomByCode: (roomCode: string, displayName: string) => Promise<RoomState>;
  hydrateRoom: (roomId: string) => Promise<void>;
  clearCurrentRoom: () => void;
  loadOrganizerDashboard: () => Promise<void>;
  loadPlayerDashboard: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Запрос завершился ошибкой.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function readStoredToken() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function readStoredRoom(): RoomSession | null {
  const raw = window.localStorage.getItem(ROOM_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

function writeStoredRoom(room: RoomSession | null) {
  if (room) {
    window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(room));
  } else {
    window.localStorage.removeItem(ROOM_STORAGE_KEY);
  }
}

function emptyState(): AppState {
  return {
    user: null,
    authReady: false,
    quizzes: [],
    history: [],
    currentRoom: null,
    rooms: [],
    playerStats: null,
    organizerStats: null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const tokenRef = useRef<string | null>(typeof window === "undefined" ? null : readStoredToken());
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = useCallback(() => {
    if (!tokenRef.current) return null;
    if (socketRef.current) return socketRef.current;

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: {
        token: tokenRef.current,
      },
    });

    socket.on("room:state", (room: RoomState) => {
      setState((current) => ({
        ...current,
        currentRoom: room,
        rooms: room ? [room] : [],
      }));
      writeStoredRoom({ roomId: room.id });
    });

    socket.on("room:error", (payload: { message: string }) => {
      console.error(payload.message);
    });

    socket.on("leaderboard:updated", (payload: { roomId: string; players: Array<{ id: string; score: number }> }) => {
      setState((current) => {
        if (!current.currentRoom || current.currentRoom.id !== payload.roomId) {
          return current;
        }

        const nextPlayers = current.currentRoom.players.map((player) => {
          const updated = payload.players.find((item) => item.id === player.id);
          return updated ? { ...player, score: updated.score } : player;
        });

        return {
          ...current,
          currentRoom: {
            ...current.currentRoom,
            players: nextPlayers,
          },
          rooms: [
            {
              ...current.currentRoom,
              players: nextPlayers,
            },
          ],
        };
      });
    });

    socket.on("room:finished", () => {
      void Promise.resolve().then(async () => {
        if (state.user?.role === "organizer") {
          await loadOrganizerDashboardRef.current?.();
        }
        if (state.user?.role === "player") {
          await loadPlayerDashboardRef.current?.();
        }
      });
    });

    socketRef.current = socket;
    return socket;
  }, [state.user?.role]);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const loadOrganizerDashboard = useCallback(async () => {
    const data = await apiFetch<{
      stats: OrganizerStats;
      quizzes: Quiz[];
      history: QuizHistory[];
    }>("/dashboard/organizer", {}, tokenRef.current);

    setState((current) => ({
      ...current,
      quizzes: data.quizzes,
      history: data.history,
      organizerStats: data.stats,
    }));
  }, []);

  const loadPlayerDashboard = useCallback(async () => {
    const data = await apiFetch<{
      stats: PlayerStats;
      history: QuizHistory[];
    }>("/dashboard/player", {}, tokenRef.current);

    setState((current) => ({
      ...current,
      history: data.history,
      playerStats: data.stats,
    }));
  }, []);

  const loadOrganizerDashboardRef = useRef<null | (() => Promise<void>)>(null);
  const loadPlayerDashboardRef = useRef<null | (() => Promise<void>)>(null);
  loadOrganizerDashboardRef.current = loadOrganizerDashboard;
  loadPlayerDashboardRef.current = loadPlayerDashboard;

  const hydrateRoom = useCallback(async (roomId: string) => {
    const data = await apiFetch<{ room: RoomState }>(`/rooms/${roomId}`, {}, tokenRef.current);
    setState((current) => ({
      ...current,
      currentRoom: data.room,
      rooms: [data.room],
    }));
    writeStoredRoom({ roomId });
    const socket = connectSocket();
    socket?.emit("room:join", { roomId }, () => undefined);
  }, [connectSocket]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const bootstrap = async () => {
      const token = readStoredToken();
      if (!token) {
        setState((current) => ({ ...current, authReady: true }));
        return;
      }

      tokenRef.current = token;
      try {
        const { user } = await apiFetch<{ user: User }>("/auth/me", {}, token);
        setState((current) => ({ ...current, user, authReady: true }));
        if (user.role === "organizer") {
          await loadOrganizerDashboard();
        } else {
          await loadPlayerDashboard();
        }

        const storedRoom = readStoredRoom();
        if (storedRoom?.roomId) {
          await hydrateRoom(storedRoom.roomId);
        }
      } catch {
        writeStoredToken(null);
        writeStoredRoom(null);
        setState((current) => ({ ...current, authReady: true, user: null }));
      }
    };

    void bootstrap();
  }, [hydrateRoom, loadOrganizerDashboard, loadPlayerDashboard]);

  const setAuthSession = useCallback(async (token: string, user: User) => {
    tokenRef.current = token;
    writeStoredToken(token);
    setState((current) => ({
      ...current,
      user,
      authReady: true,
      history: [],
      quizzes: [],
      organizerStats: null,
      playerStats: null,
    }));

    if (user.role === "organizer") {
      await loadOrganizerDashboard();
    } else {
      await loadPlayerDashboard();
    }
  }, [loadOrganizerDashboard, loadPlayerDashboard]);

  const clearCurrentRoom = useCallback(() => {
    writeStoredRoom(null);
    socketRef.current?.emit("room:leave");
    setState((current) => ({
      ...current,
      currentRoom: null,
      rooms: [],
    }));
  }, []);

  const createQuiz = useCallback(async (quiz: Quiz) => {
    const { quiz: created } = await apiFetch<{ quiz: Quiz }>(
      "/quizzes",
      {
        method: "POST",
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          timePerQuestion: quiz.timePerQuestion,
          questions: quiz.questions,
        }),
      },
      tokenRef.current,
    );
    setState((current) => ({
      ...current,
      quizzes: [created, ...current.quizzes],
    }));
    return created;
  }, []);

  const updateQuiz = useCallback(async (quiz: Quiz) => {
    const { quiz: updated } = await apiFetch<{ quiz: Quiz }>(
      `/quizzes/${quiz.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          timePerQuestion: quiz.timePerQuestion,
          questions: quiz.questions,
        }),
      },
      tokenRef.current,
    );
    setState((current) => ({
      ...current,
      quizzes: current.quizzes.map((item) => (item.id === updated.id ? updated : item)),
    }));
    return updated;
  }, []);

  const deleteQuiz = useCallback(async (quizId: string) => {
    await apiFetch(`/quizzes/${quizId}`, { method: "DELETE" }, tokenRef.current);
    setState((current) => ({
      ...current,
      quizzes: current.quizzes.filter((item) => item.id !== quizId),
    }));
  }, []);

  const uploadQuestionImage = useCallback(async (quizId: string, questionId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const data = await apiFetch<{ imageUrl: string }>(
      `/quizzes/${quizId}/questions/${questionId}/image`,
      {
        method: "POST",
        body: formData,
      },
      tokenRef.current,
    );
    return data.imageUrl;
  }, []);

  const createRoom = useCallback(async (quizId: string) => {
    const data = await apiFetch<{ room: RoomState }>(
      "/rooms",
      {
        method: "POST",
        body: JSON.stringify({ quizId }),
      },
      tokenRef.current,
    );
    setState((current) => ({
      ...current,
      currentRoom: data.room,
      rooms: [data.room],
    }));
    writeStoredRoom({ roomId: data.room.id });
    const socket = connectSocket();
    socket?.emit("room:join", { roomId: data.room.id }, () => undefined);
    return data.room;
  }, [connectSocket]);

  const joinRoomByCode = useCallback(async (roomCode: string, displayName: string) => {
    const roomCodeUpper = roomCode.trim().toUpperCase();
    if (!roomCodeUpper) {
      throw new Error("Введите код комнаты.");
    }
    const preview = await apiFetch<{ room: RoomState }>(`/rooms/by-code/${roomCodeUpper}`, {}, tokenRef.current);
    setState((current) => ({
      ...current,
      currentRoom: preview.room,
      rooms: [preview.room],
    }));
    writeStoredRoom({ roomId: preview.room.id });

    const socket = connectSocket();
    await new Promise<void>((resolve, reject) => {
      socket?.emit(
        "room:join",
        { roomCode: roomCodeUpper, displayName },
        (result: { ok: boolean; message?: string }) => {
          if (!result?.ok) {
            reject(new Error(result?.message ?? "Не удалось войти в комнату."));
            return;
          }
          resolve();
        },
      );
    });
    return preview.room;
  }, [connectSocket]);

  const login = useCallback(async (email: string, password: string, role?: "player" | "organizer"): Promise<AuthResult> => {
    try {
      const data = await apiFetch<{ token: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password, role }),
        },
      );
      await setAuthSession(data.token, data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: normalizeError(error, "Не удалось войти.") };
    }
  }, [setAuthSession]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: "player" | "organizer",
  ): Promise<AuthResult> => {
    try {
      const data = await apiFetch<{ token: string; user: User }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        },
      );
      await setAuthSession(data.token, data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: normalizeError(error, "Не удалось зарегистрироваться.") };
    }
  }, [setAuthSession]);

  const logout = useCallback(async () => {
    try {
      if (tokenRef.current) {
        await apiFetch("/auth/logout", { method: "POST" }, tokenRef.current);
      }
    } catch {
      // noop
    }
    disconnectSocket();
    tokenRef.current = null;
    writeStoredToken(null);
    writeStoredRoom(null);
    setState(emptyState());
    setState((current) => ({ ...current, authReady: true }));
  }, [disconnectSocket]);

  const submitAnswer = useCallback(async (questionId: string, selectedAnswerIds: string[]) => {
    const currentRoom = state.currentRoom;
    const socket = connectSocket();

    if (!currentRoom || !socket) {
      throw new Error("Комната недоступна для отправки ответа.");
    }

    const result = await new Promise<{ ok: boolean; message?: string; isCorrect?: boolean; pointsEarned?: number }>((resolve) => {
      socket.emit(
        "room:submit-answer",
        {
          roomId: currentRoom.id,
          questionId,
          selectedAnswerIds,
        },
        resolve,
      );
    });

    if (!result.ok) {
      throw new Error(result.message ?? "Не удалось отправить ответ.");
    }

    return {
      ok: true,
      isCorrect: Boolean(result.isCorrect),
      pointsEarned: result.pointsEarned ?? 0,
    } as const;
  }, [connectSocket, state.currentRoom]);

  const dispatch = useCallback((action: Action) => {
    switch (action.type) {
      case "ADD_QUIZ":
        void createQuiz(action.payload);
        break;
      case "UPDATE_QUIZ":
        void updateQuiz(action.payload);
        break;
      case "DELETE_QUIZ":
        void deleteQuiz(action.payload);
        break;
      case "SET_CURRENT_ROOM":
        if (action.payload === null) {
          clearCurrentRoom();
        } else {
          setState((current) => ({
            ...current,
            currentRoom: action.payload,
            rooms: action.payload ? [action.payload] : [],
          }));
          writeStoredRoom({ roomId: action.payload.id });
        }
        break;
      case "START_GAME":
        socketRef.current?.emit("room:start", { roomId: state.currentRoom?.id });
        break;
      case "NEXT_QUESTION":
        socketRef.current?.emit("room:next-question", { roomId: state.currentRoom?.id });
        break;
      case "END_GAME":
        socketRef.current?.emit("room:end", { roomId: state.currentRoom?.id });
        break;
      case "SUBMIT_ANSWER":
        if (!state.currentRoom) return;
        socketRef.current?.emit("room:submit-answer", {
          roomId: state.currentRoom.id,
          questionId: action.payload.questionId,
          selectedAnswerIds: action.payload.selectedAnswerIds,
        });
        break;
      default:
        break;
    }
  }, [clearCurrentRoom, createQuiz, deleteQuiz, state.currentRoom, updateQuiz]);

  const value = useMemo<AppContextValue>(() => ({
    state: {
      ...state,
      rooms: state.currentRoom ? [state.currentRoom] : [],
    },
    dispatch,
    submitAnswer,
    login,
    register,
    logout,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    uploadQuestionImage,
    createRoom,
    joinRoomByCode,
    hydrateRoom,
    clearCurrentRoom,
    loadOrganizerDashboard,
    loadPlayerDashboard,
  }), [
    clearCurrentRoom,
    createQuiz,
    createRoom,
    deleteQuiz,
    dispatch,
    hydrateRoom,
    joinRoomByCode,
    login,
    loadOrganizerDashboard,
    loadPlayerDashboard,
    logout,
    register,
    state,
    submitAnswer,
    updateQuiz,
    uploadQuestionImage,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within AppProvider");
  return context;
}

export function useAuth() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAuth must be used within AppProvider");

  return {
    user: context.state.user,
    authReady: context.state.authReady,
    login: async (email: string, password: string, role?: "player" | "organizer") => context.login(email, password, role),
    register: async (name: string, email: string, password: string, role: "player" | "organizer") =>
      context.register(name, email, password, role),
    logout: async () => context.logout(),
  };
}

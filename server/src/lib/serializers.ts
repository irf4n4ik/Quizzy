import type {
  AnswerOption,
  GameRoom,
  Question,
  Quiz,
  RoomAnswer,
  RoomParticipant,
  User,
} from "@prisma/client";

type QuizWithQuestions = Pick<
  Quiz,
  "id" | "title" | "description" | "category" | "defaultTimePerQuestion" | "createdAt" | "updatedAt" | "authorId"
> & {
  questions: Array<Question & { answers: AnswerOption[] }>;
};

type RoomWithRelations = GameRoom & {
  quiz: QuizWithQuestions;
  host: User;
  participants: RoomParticipant[];
  answers: RoomAnswer[];
};

export function toClientUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "ORGANIZER" ? "organizer" : "player",
    createdAt: user.createdAt.getTime(),
  };
}

export function toClientQuiz(quiz: QuizWithQuestions) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    createdBy: quiz.authorId,
    timePerQuestion: quiz.defaultTimePerQuestion,
    createdAt: quiz.createdAt.getTime(),
    updatedAt: quiz.updatedAt.getTime(),
    questions: quiz.questions
      .sort((left, right) => left.order - right.order)
      .map((question) => ({
        id: question.id,
        text: question.text,
        imageUrl: question.imagePath ? `/uploads/${question.imagePath.replace(/\\/g, "/")}` : undefined,
        multipleChoice: question.type === "MULTIPLE",
        timeLimit: question.timeLimit,
        points: question.points,
        answers: question.answers
          .sort((left, right) => left.order - right.order)
          .map((answer) => ({
            id: answer.id,
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
      })),
  };
}

export function toRoomSummary(room: RoomWithRelations) {
  return {
    id: room.id,
    code: room.code,
    quizId: room.quizId,
    quizTitle: room.quiz.title,
    hostId: room.hostId,
    hostName: room.host.name,
    status: room.status.toLowerCase(),
    currentQuestionIndex: room.currentQuestionIndex,
    startedAt: room.startedAt?.getTime(),
    finishedAt: room.finishedAt?.getTime(),
    questionStartedAt: room.currentQuestionStartedAt?.getTime(),
    questionEndsAt: room.currentQuestionEndsAt?.getTime(),
    players: room.participants
      .map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        name: participant.displayName,
        score: participant.finalScore,
        connected: participant.connected,
      }))
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "ru")),
  };
}

export function toRoomState(
  room: RoomWithRelations,
  viewer: "host" | "player",
  viewerUserId?: string,
) {
  const base = toRoomSummary(room);
  const currentQuestion =
    room.currentQuestionIndex >= 0 ? room.quiz.questions[room.currentQuestionIndex] : null;

  const answersByParticipant = new Map(room.answers.map((answer) => [`${answer.participantId}:${answer.questionId}`, answer]));

  const myParticipant =
    viewerUserId == null
      ? undefined
      : room.participants.find((participant) => participant.userId === viewerUserId);
  const myAnswer =
    myParticipant && currentQuestion
      ? answersByParticipant.get(`${myParticipant.id}:${currentQuestion.id}`)
      : undefined;
  const revealCorrectAnswers =
    viewer === "host" ||
    room.status === "FINISHED" ||
    (room.currentQuestionEndsAt != null && room.currentQuestionEndsAt.getTime() <= Date.now());

  return {
    ...base,
    quiz: {
      id: room.quiz.id,
      title: room.quiz.title,
      description: room.quiz.description,
      category: room.quiz.category,
      timePerQuestion: room.quiz.defaultTimePerQuestion,
      questionsCount: room.quiz.questions.length,
    },
    currentQuestion: currentQuestion
      ? {
          id: currentQuestion.id,
          text: currentQuestion.text,
          imageUrl: currentQuestion.imagePath ? `/uploads/${currentQuestion.imagePath.replace(/\\/g, "/")}` : undefined,
          multipleChoice: currentQuestion.type === "MULTIPLE",
          timeLimit: currentQuestion.timeLimit,
          points: currentQuestion.points,
          answers: currentQuestion.answers
            .sort((left, right) => left.order - right.order)
            .map((answer) => ({
              id: answer.id,
              text: answer.text,
              ...(revealCorrectAnswers ? { isCorrect: answer.isCorrect } : {}),
            })),
        }
      : null,
    results:
      room.status === "FINISHED"
        ? room.participants
            .map((participant) => ({
              id: participant.id,
              userId: participant.userId,
              name: participant.displayName,
              score: participant.finalScore,
              correctAnswers: participant.correctAnswers,
            }))
            .sort((left, right) => right.score - left.score || right.correctAnswers - left.correctAnswers)
        : [],
    mySubmission:
      myParticipant && currentQuestion
        ? myAnswer
          ? {
              questionId: currentQuestion.id,
              submitted: true,
              selectedAnswerIds: Array.isArray(myAnswer.selectedOptionIds)
                ? myAnswer.selectedOptionIds.filter((answerId): answerId is string => typeof answerId === "string")
                : [],
            }
          : {
              questionId: currentQuestion.id,
              submitted: false,
              selectedAnswerIds: [],
            }
        : undefined,
  };
}

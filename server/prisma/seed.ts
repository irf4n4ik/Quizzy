import { PrismaClient, QuestionType, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.roomAnswer.deleteMany();
  await prisma.roomParticipant.deleteMany();
  await prisma.gameRoom.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  const organizerPasswordHash = await hashPassword("demo12345");
  const playerPasswordHash = await hashPassword("demo12345");

  const organizer = await prisma.user.create({
    data: {
      name: "Демо организатор",
      email: "organizer@quizzy.local",
      passwordHash: organizerPasswordHash,
      role: UserRole.ORGANIZER,
    },
  });

  await prisma.user.create({
    data: {
      name: "Демо игрок",
      email: "player@quizzy.local",
      passwordHash: playerPasswordHash,
      role: UserRole.PLAYER,
    },
  });

  await prisma.quiz.create({
    data: {
      title: "Основы веб-разработки",
      description: "Квиз по HTML, CSS и JavaScript для демонстрации платформы.",
      category: "Технологии",
      defaultTimePerQuestion: 20,
      authorId: organizer.id,
      questions: {
        create: [
          {
            order: 0,
            text: "Какой язык программирования чаще всего используют для frontend-разработки?",
            type: QuestionType.SINGLE,
            timeLimit: 20,
            points: 100,
            answers: {
              create: [
                { order: 0, text: "Python", isCorrect: false },
                { order: 1, text: "JavaScript", isCorrect: true },
                { order: 2, text: "C++", isCorrect: false },
                { order: 3, text: "Java", isCorrect: false }
              ]
            }
          },
          {
            order: 1,
            text: "Какие из перечисленных являются JavaScript-фреймворками или библиотеками?",
            type: QuestionType.MULTIPLE,
            timeLimit: 25,
            points: 150,
            answers: {
              create: [
                { order: 0, text: "React", isCorrect: true },
                { order: 1, text: "Django", isCorrect: false },
                { order: 2, text: "Vue.js", isCorrect: true },
                { order: 3, text: "Laravel", isCorrect: false }
              ]
            }
          },
          {
            order: 2,
            text: "Что означает аббревиатура CSS?",
            type: QuestionType.SINGLE,
            timeLimit: 15,
            points: 100,
            answers: {
              create: [
                { order: 0, text: "Computer Style Sheets", isCorrect: false },
                { order: 1, text: "Cascading Style Sheets", isCorrect: true },
                { order: 2, text: "Creative Style System", isCorrect: false },
                { order: 3, text: "Colorful Style Sheets", isCorrect: false }
              ]
            }
          }
        ]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

const { Telegraf, Scenes, session } = require("telegraf");
const cron = require("node-cron");

const BOT_TOKEN = "7670037725:AAHbO875fALA8amgdI2Dlpj6EWHV_Ry-cpI";
const bot = new Telegraf(BOT_TOKEN);
const store = {
  pinnedMessage: null,
  systemMessageId: null,
  chatId: null,
};

// Обработчик команды /post
bot.command("post", async (ctx) => {
  // Проверяем, что команда вызвана в ответ на сообщение
  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      "Ответьте на сообщение командой /post чтобы закрепить его"
    );
  }

  // Сохраняем данные
  store.pinnedMessage = ctx.message.reply_to_message.message_id;
  store.chatId = ctx.chat.id;

  // Пингуем всех участников (работает только в группах/супергруппах)
  try {
    await ctx.telegram.unpinAllChatMessages(store.chatId);
    await ctx.telegram.pinChatMessage(store.chatId, store.pinnedMessage);

    // Сохраняем ID системного сообщения (последнее сообщение в чате)
    const messages = await ctx.telegram.getChatHistory(store.chatId, 1, 0, 1);
    store.systemMessageId = messages[0].message_id;
  } catch (e) {
    console.error("Ошибка при закреплении:", e);
  }
});

// Настраиваем cron-задачу (каждые 30 секунд для теста)
cron.schedule("*/30 * * * * *", async () => {
  if (!store.chatId || !store.pinnedMessage) return;

  try {
    // 1. Удаляем системное сообщение о закреплении
    if (store.systemMessageId) {
      await bot.telegram.deleteMessage(store.chatId, store.systemMessageId);
    }

    // 2. Открепляем сообщение
    await bot.telegram.unpinChatMessage(store.chatId);

    // 3. Закрепляем снова
    await bot.telegram.pinChatMessage(store.chatId, store.pinnedMessage);

    // 4. Обновляем ID системного сообщения
    const chat = await ctx.telegram.getChat(store.chatId);
    store.systemMessageId = chat.message_id;
  } catch (e) {
    console.error("Ошибка в cron-задаче:", e);
  }
});

// Запуск бота
bot.launch();
console.log("Бот запущен");

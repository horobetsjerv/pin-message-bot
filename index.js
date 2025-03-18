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
  const deleteCommand = async () => {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error("Не удалось удалить сообщение:", e);
    }
  };

  // Проверяем, что команда вызвана в ответ на сообщение
  if (!ctx.message.reply_to_message) {
    await ctx.reply("Ответьте на сообщение командой /post чтобы закрепить его");
    await deleteCommand(); // Удаляем команду
    return;
  }

  // Сохраняем данные
  store.pinnedMessage = ctx.message.reply_to_message.message_id;
  store.chatId = ctx.chat.id;

  // Пингуем всех участников (работает только в группах/супергруппах)
  try {
    await ctx.telegram.unpinAllChatMessages(store.chatId);
    await ctx.telegram.pinChatMessage(store.chatId, store.pinnedMessage);

    // Сохраняем ID системного сообщения (последнее сообщение в чате)

    await deleteCommand(); // Удаляем команду после успешного выполнения
  } catch (e) {
    console.error("Ошибка при закреплении:", e);
    await deleteCommand(); // Удаляем команду даже при ошибке
  }
});

bot.command("stop", async (ctx) => {
  store.pinnedMessage = null;
  await ctx.deleteMessage();
});

// Настраиваем cron-задачу (каждые 30 секунд для теста)
bot.on("message", async (ctx) => {
  if (
    ctx.message.new_chat_members ||
    ctx.message.pinned_message ||
    ctx.message.left_chat_member
  ) {
    store.systemMessageId = ctx.message.message_id;

    try {
      //   await ctx.deleteMessage();
      //   console.log(`Удалено системное сообщение: ${ctx.message.message_id}`);
    } catch (error) {
      console.error("Ошибка при удалении сообщения:", error);
    }
  }
});
cron.schedule("0 */2 * * *", async () => {
  if (!store.chatId || !store.pinnedMessage) return;

  try {
    // 1. Удаляем системное сообщение о закреплении
    // console.log(store.systemMessageId);
    if (store.systemMessageId) {
      console.log(store.systemMessageId);
      await bot.telegram
        .deleteMessage(store.chatId, store.systemMessageId)
        .catch((e) => console.log("Системное сообщение уже удалено"));
    }

    // 2. Открепляем сообщение
    await bot.telegram.unpinChatMessage(store.chatId);

    // 3. Закрепляем снова
    await bot.telegram.pinChatMessage(store.chatId, store.pinnedMessage);

    // 4. Обновляем ID системного сообщения
    // const chat = await ctx.telegram.getChat(store.chatId);
    // store.systemMessageId = chat.message_id;
  } catch (e) {
    console.error("Ошибка в cron-задаче:", e);
  }
});

// Запуск бота
bot.launch();
console.log("Бот запущен");

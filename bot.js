import { Bot, InputFile } from 'grammy';
import { translate, speak } from 'google-translate-api-x';
import pkg from '@romanize/korean';
import http from 'http'; 
import 'dotenv/config';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const bot = new Bot(BOT_TOKEN);
const { romanize } = pkg;

const getTranslationAndAudio = async (text) => {
    try {
        const translationResult = await translate(text, { from: 'ru', to: 'ko' });
        const koreanText = translationResult.text;
        const audioBase64 = await speak(koreanText, { to: 'ko' });
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        return { koreanText, audioBuffer };
    } catch (error) {
        console.error('Ошибка при переводе или получении аудио:', error);

        return null;
    }
};

bot.command('start', async (ctx) => await ctx.reply('🇷🇺🇰🇷 Привет! Я ПереКор: перевожу на корейский, даю транскрипцию и произношение. Попробуй: напиши «спасибо».'));
bot.on('message:text', async (ctx) => {
    const userText = ctx.message.text;
    await ctx.reply(`🔍 Обрабатываю запрос: '${userText}'...`);

    const result = await getTranslationAndAudio(userText);

    if (!result) {
        await ctx.reply('❌ Не удалось перевести текст. Попробуйте позже.');
        return;
    }

    const transcription = romanize(result.koreanText);

    await ctx.reply(`✅ Перевод (хангыль): ${result.koreanText}\n📖 Транскрипция (латиницей): ${transcription}`);
    await ctx.replyWithVoice(new InputFile(result.audioBuffer), {
        caption: '🎙️ Произношение слова на корейском',
    });
});

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!\n');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Простой HTTP-сервер запущен на порту ${port}`);
});

bot.start();

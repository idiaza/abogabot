const restify = require('restify');
const path = require('path');
const {
  BotFrameworkAdapter,
  ConversationState,
  MemoryStorage,
  UserState
} = require('botbuilder');
const { BotConfiguration } = require('botframework-config');
const { AbogaBot } = require('./bot');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    // console.log(`\n${ server.name } listening to ${ server.url }.`);
});

const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));

let botConfig;
try {
    // Read bot configuration from .bot file.
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    process.exit();
}

const DEV_ENVIRONMENT = 'development';

const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);

const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);

const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    console.error(`\n [onTurnError]: ${ error }`);
    // Send a message to the user
    await context.sendActivity(`Oops. Something went wrong!`);
    // Clear out state
    await conversationState.delete(context);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const bot = new AbogaBot(conversationState, userState);

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (turnContext) => {
        await bot.onTurn(turnContext);
    });
});
const {
  ActivityTypes,
  CardFactory,
} = require('botbuilder');
const {
  ListStyle,
  DialogSet,
  DialogTurnStatus,
  WaterfallDialog,
  TextPrompt,
  ChoicePrompt,
} = require('botbuilder-dialogs');

const DIALOG_STATE_PROPERTY = 'DIALOG_STATE_PROPERTY';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

const PROMPT_TOPIC = 'PROMPT_TOPIC';
const PROMPT_CONFIRM = 'PROMPT_CONFIRM';
const PROMPT_NAME = 'PROMPT_NAME';
const PROMPT_DOCUMENT = 'PROMPT_DOCUMENT';
const PROMPT_CLAIM = 'PROMPT_CLAIM';
const PROMPT_DATE = 'PROMPT_DATE';
const PROMPT_CHANNEL = 'PROMPT_CHANNEL';

const WATERFALL_WELCOME = 'WATERFALL_WELCOME';
const WATERFALL_GET_TOPIC = 'WATERFALL_GET_TOPIC';
const WATERFALL_GET_DETAILS = 'WATERFALL_GET_DETAILS';
const WATERFALL_CONFIRM = 'WATERFALL_CONFIRM';

const TEXT_WELCOME = `Hola, soy Abogabot y estoy en entrenamiento para ayudarte mejor :) Puedes escribir "Temas" en cualquier momento para listarte los temas en los que puedo asesorarte o "Cancelar" si ya no deseas conversar.`;
const TEXT_PROMPT_TOPIC = 'En que te puedo ayudar?.';
const TEXT_PROMPT_TOPIC_RETRY = 'Para poder ayudarte es necesario que elijas un tema. Puedes escribir "Cancelar" en caso de que ya no quieras conversar :(';

const YES = 'Si';
const NO = 'No';
const CANCEL = 'cancelar';
const HELP = 'ayuda';
const MENU = 'temas';
// const GREETING_UTTERANCE = 'hola';

const TOPICS = require('./flow.js');
// const TOPICS_TITLES = [
//   'Inc. Entrega', // de producto comprado a distancia
//   'Ops. No reconocidas',
//   'Inc. Extorno',
// ];
const TOPICS_TITLES = TOPICS.map(function (topic) {
  return topic.title;
});

class AbogaBot {

  constructor(conversationState, userState) {
    this.conversationState = conversationState;
    this.userState = userState;

    this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
    this.userProfile = this.userState.createProperty(USER_PROFILE_PROPERTY);

    this.dialogs = new DialogSet(this.dialogState);

    const promptTopic = new ChoicePrompt(PROMPT_TOPIC);
    promptTopic.style = ListStyle.heroCard;
    this.dialogs
      .add(promptTopic)
      .add(new ChoicePrompt(PROMPT_CONFIRM))

    this.dialogs
      .add(new TextPrompt(PROMPT_NAME))
      .add(new TextPrompt(PROMPT_DOCUMENT))
      .add(new TextPrompt(PROMPT_CLAIM))
      .add(new TextPrompt(PROMPT_DATE))
      .add(new TextPrompt(PROMPT_CHANNEL))

    this.dialogs
      .add(new WaterfallDialog(WATERFALL_WELCOME)
        .addStep(this.sendWelcome.bind(this))
      );

    this.dialogs
      .add(new WaterfallDialog(WATERFALL_GET_TOPIC)
        .addStep(this.promptForTopic.bind(this))
        .addStep(this.captureTopic.bind(this))
      )

    this.dialogs
      .add(new WaterfallDialog(WATERFALL_GET_DETAILS)
        .addStep(this.promptForName.bind(this))
        .addStep(this.promptForDocument.bind(this))
        .addStep(this.promptForClaim.bind(this))
        .addStep(this.promptForDate.bind(this))
        .addStep(this.promptForChannel.bind(this))
        .addStep(this.saveDetails.bind(this))
      )

    for (var topicIndex = 0; topicIndex < TOPICS_TITLES.length; topicIndex++) {
      const title = TOPICS_TITLES[topicIndex];
      const data = TOPICS[topicIndex];
      const questions = data.questions;
      const questionsLength = questions.length;

      const wd = new WaterfallDialog(title);

      wd.addStep(this.makePrePromptForYesOrNo(topicIndex).bind(this));

      for (var questionIndex = 0; questionIndex < questions.length; questionIndex++) {
        wd.addStep(this.makePromptForYesOrNo(
          topicIndex,
          questionIndex
        ).bind(this));
      }

      wd.addStep(this.makePostPromptForYesOrNo(topicIndex).bind(this));

      this.dialogs.add(wd);
    }

    this.dialogs
      .add(new WaterfallDialog(WATERFALL_CONFIRM)
        .addStep(this.promptConfirmMenu.bind(this))
        .addStep(this.decideIfSendMenu.bind(this))
      );
  }

  async promptConfirmMenu(step) {
    // console.log('---------');
    // for (var i = 0; i < TOPICS.length; i++) {
    //   console.log('xxxx'); TOPICS[i].possibilities;
    // }
    await step.prompt(PROMPT_CONFIRM, 'Quieres que te asesore con otro tema', [YES, NO]);
    // console.log('cleared...');
  }

  async decideIfSendMenu(step) {
    await this.userProfile.set(step.context, {});

    if (this.binarize(step.result.value)) {
      await step.beginDialog(WATERFALL_GET_TOPIC);
    }
    else {
      await step.context.sendActivity('Gracias por preguntarme, estaré aquí por si tienes mas dudas... Bye!');
      await step.endDialog();
    }
  }

  contains(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (text.toLowerCase().indexOf(words[i]) > -1) {
        return true;
      }
    }

    return false;
  }

  async isTurnInterrupted(dc, utterance) {

    // see if there are any conversation interrupts we need to handle
    if (utterance === CANCEL) {
        if (dc.activeDialog) {
            await dc.cancelAllDialogs();
            await dc.context.sendActivity(`No te preocupes, puedes volver a hablarme cuando lo desees :)`);
        } else {
            await dc.context.sendActivity(`Escribe "Temas" para mostrarte el menú.`); // I don't have anything to cancel.
        }
        // handled the interrupt
        return true;
    }

    if (utterance === HELP) {
        await dc.context.sendActivity(`Permiteme ayudarte.`); //Let me try to provide some help
        await dc.context.sendActivity(`Puedo comprender saludos y los comandos "Temas", "Ayuda" y "Cancelar".`);

        if (dc.activeDialog) {
            // We've shown help, re-prompt again to continue where the dialog left over
            await dc.repromptDialog();
        }
        // handled the interrupt
        return true;
    }

    // see if there are any conversation interrupts we need to handle
    if (utterance === MENU) {
        if (dc.activeDialog) {
            await dc.cancelAllDialogs();
        }

        await dc.cancelAllDialogs();

        await dc.context.sendActivity(`Perfecto, entonces te mostraré nuevamente el listado de temas.`);
        await dc.beginDialog(WATERFALL_GET_TOPIC);

        // handled the interrupt
        return true;
    }

    // did not handle the interrupt
    return false;
  }

  async onTurn(turnContext) {

    // Create a dialog context
    const dc = await this.dialogs.createContext(turnContext);

    if (turnContext.activity.type === ActivityTypes.Message) {
      // Normalizes all user's text inputs
      const utterance = turnContext.activity.text.trim().toLowerCase();

        // handle conversation interrupts first
        const interrupted = await this.isTurnInterrupted(dc, utterance);
        if (!interrupted) {
            // Continue the current dialog
            const dialogResult = await dc.continueDialog();

            // If no one has responded,
            if (!dc.context.responded) {
                // Examine results from active dialog
                switch (dialogResult.status) {
                case DialogTurnStatus.empty:
                  if (this.contains(utterance, ['hola', 'hi', 'como estas'])) {

                    await dc.context.sendActivities([
                      { type: ActivityTypes.Typing }, // ActivityTypes.Typing
                      { type: 'delay', value: 2000 },
                      // { type: 'message', text: 'Hello... How are you?' }
                    ]);
                    await dc.beginDialog(WATERFALL_WELCOME);

                  } else {
                    // Help or no intent identified, either way, let's provide some help
                    // to the user
                    await dc.context.sendActivity(`Aún no comprendo lo que intentas decirme. Intenta escribiendo "Hola", "Ayuda" or "Cancelar".`); // I didn't understand what you just said to me. Try saying 'hello', 'help' or 'cancel'.
                  }
                  break;
                case DialogTurnStatus.waiting:
                  // The active dialog is waiting for a response from the user, so do nothing
                  break;
                case DialogTurnStatus.complete:
                  await dc.endDialog();
                  break;
                default:
                  await dc.cancelAllDialogs();
                  break;
                }
            }
        }
        // Make sure to persist state at the end of a turn.
        await this.userState.saveChanges(turnContext);
        await this.conversationState.saveChanges(turnContext);
    } else if (turnContext.activity.type === 'conversationUpdate' && turnContext.activity.membersAdded[0].name === 'Bot') {
        // When activity type is "conversationUpdate" and the member joining the conversation is the bot
        // we will send a welcome message.
        await dc.context.sendActivity(`Bienvenido! Prueba escribiendo algo como "Hola" para empezar a conversar.`); // Welcome to the message routing bot! Try saying 'hello' to start talking, and use 'help' or 'cancel' at anytime to try interruption and cancellation.
    }












    // // console.log(turnContext.activity); return;
    // const dialogContext = await this.dialogs.createContext(turnContext);
    // const results = await dialogContext.continueDialog();

    // /*if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
    //   if (turnContext.activity.membersAdded.length !== 0) {
    //     for (let idx in turnContext.activity.membersAdded) {
    //       if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
    //         // await dialogContext.beginDialog(WATERFALL_WELCOME);
    //       }
    //     }
    //   }
    // } else */if (turnContext.activity.type === ActivityTypes.Message) {
    //   if (results) {
    //     switch (results.status) {
    //       case DialogTurnStatus.cancelled:
    //       case DialogTurnStatus.empty:

    //       console.log('empty');
    //           // If there is no active dialog, we should clear the user info and start a new dialog.
    //           await this.userProfile.set(turnContext, {});

    //           if (this.contains(turnContext.activity.text, ['hola', 'hi', 'como estas'])) {
    //             await dialogContext.beginDialog(WATERFALL_WELCOME);
    //           } else {
    //             await dialogContext.beginDialog(WATERFALL_GET_TOPIC);
    //           }

    //           break;
    //       case DialogTurnStatus.complete:
    //       console.log('complete');
    //           // // If we just finished the dialog, capture and display the results.
    //           break;
    //       case DialogTurnStatus.waiting:
    //       console.log('waiting');
    //           // If there is an active dialog, we don't need to do anything here.
    //           if (turnContext.activity.text.toLowerCase() === 'temas') {

    //             // await this.userProfile.set(turnContext, {});

    //             await dialogContext.endDialog();
    //             await dialogContext.cancelAllDialogs();

    //             await dialogContext.beginDialog(WATERFALL_GET_TOPIC);
    //           }

    //           break;
    //     }
    //   }
    // }

    // await this.conversationState.saveChanges(turnContext);
    // await this.userState.saveChanges(turnContext);





























  //   if (turnContext.activity.type === ActivityTypes.Message) {
  //     // Run the DialogSet - let the framework identify the current state of the dialog from
  //     // the dialog stack and figure out what (if any) is the active dialog.
  //     const dialogContext = await this.dialogs.createContext(turnContext);
  //     const results = await dialogContext.continueDialog();

  //     switch (results.status) {
  //         case DialogTurnStatus.cancelled:
  //         case DialogTurnStatus.empty:
  //         console.log('cancelled or empty');
  //             // If there is no active dialog, we should clear the user info and start a new dialog.
  //             await this.userProfile.set(turnContext, {});
  //             await this.userState.saveChanges(turnContext);
  //             await dialogContext.beginDialog(WATERFALL_WELCOME);
  //             break;
  //         case DialogTurnStatus.complete:
  //             console.log('complete');
  //             // If we just finished the dialog, capture and display the results.
  //             const userInfo = results.result;
  //             const status = 'You are signed up to review ';
  //             await turnContext.sendActivity(status);
  //             await this.userProfile.set(turnContext, userInfo);
  //             await this.userState.saveChanges(turnContext);
  //             break;
  //         case DialogTurnStatus.waiting:
  //             console.log('waiting');
  //             // If there is an active dialog, we don't need to do anything here.
  //             break;
  //     }
  //     await this.conversationState.saveChanges(turnContext);
  // } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
  //     if (turnContext.activity.membersAdded && turnContext.activity.membersAdded.length > 0) {
  //       await turnContext.sendActivity('CONVERSATION UPDATE / welcome');
  //     }
  // } else {
  //     await turnContext.sendActivity(`[${turnContext.activity.type} event detected]`);
  // }















  }

  async capture(step, key, value) {
    const user = await this.userProfile.get(step.context, {});
    user[key] = value;
    await this.userProfile.set(step.context, user);
  }

  async clearUserAnswers(context, size) {
    let user = await this.userProfile.get(context, {});
    user.userAnswers = [];
    for (var i = 0; i < size; i++) {
      user.userAnswers.push(null);
    }
    await this.userProfile.set(context, user);
  }

  binarize(userAnswer) {
    switch (userAnswer) {
      case YES:
        return true;
      case NO:
        return false;
      default:
        return null;
    }
  }

  async saveUserAnswer(context, questionIndex, userAnswer) {
    const user = await this.userProfile.get(context, {});
    user.currentQuestionIndex = questionIndex;
    user.userAnswers[questionIndex] = this.binarize(userAnswer);
    await this.userProfile.set(context, user);
  }

  async getResult(context, topicIndex) {
    const user = await this.userProfile.get(context, {});
    const userAnswers = user.userAnswers;

    if (!user.possibilities) {
      // clone array
      user.possibilities = JSON.parse(JSON.stringify(TOPICS[topicIndex].possibilities));
    }

    // console.log('getResult');
    // console.log(TOPICS[topicIndex].possibilities);

    let result;
    for (var i = 0; i < user.possibilities.length; i++) {
      for (var x = 0; x < user.possibilities[i].paths.length; x++) {
        const path = user.possibilities[i].paths[x];

        // console.log(path);

        // if (user.possibilities[i].paths[x] !== undefined) {

          let done = true;

          for (var y = 0; y < userAnswers.length; y++) {
            if (path[y] !== userAnswers[y]) {
              done = false;

              if (y <= user.currentQuestionIndex) {
                user.possibilities[i].paths[x] = undefined;
              }

              break;
            }
          }

          if (done) {
            result = user.possibilities[i].result;
            break;
          }

        // }
      }

      user.possibilities[i].paths = user.possibilities[i].paths.filter((path) => {
        if (path !== undefined)
          return true;
      });

      if (result)
        break;
    }

    // console.log('--------');
    // console.log(user.possibilities[0].paths);
    // console.log(user.possibilities[1].paths);
    await this.userProfile.set(context, user);

    return result;
  }

  async shouldPrompt(context, topicIndex, questionIndex) {
    const user = await this.userProfile.get(context, {});
    const possibilities = user.possibilities;

    if (!possibilities)
      return true;

    for (var x = 0; x < possibilities.length; x++) {
      const paths = possibilities[x].paths;

      for (var y = 0; y < paths.length; y++) {
        const path = paths[y];

        if (path[questionIndex] !== null) {
          return true;
        }
      }
    }

    return false;
  }

  makeResultMessage(result) {
    return ('Entonces este caso es ' + (result && result.toLowerCase()) || 'No tengo una respuesta en este momento.');
  }

  makePrePromptForYesOrNo(topicIndex) {
    const description = TOPICS[topicIndex].description;
    const questionsLength = TOPICS[topicIndex].questions.length;

    return async function (step) {
      await this.clearUserAnswers(step.context, questionsLength);
      // await step.context.sendActivity('Gracias');
      // await step.context.sendActivity('Elegiste ' + TOPICS_TITLES[topicIndex].toLowerCase());
      await step.context.sendActivity(description);
      await step.continueDialog();
    }
  }

  makePromptForYesOrNo(topicIndex, questionIndex) {
    return async function (step) {
      if (questionIndex > 0) {
        // if (step.result) {
          await this.saveUserAnswer(step.context, questionIndex -1, step.result.value);

          const result = await this.getResult(step.context, topicIndex);
          if (result) {
            await step.context.sendActivity(this.makeResultMessage(result));
            await step.endDialog();
            await step.beginDialog(WATERFALL_CONFIRM);
            return;
          }
        // }
      }

      if (!await this.shouldPrompt(step.context, topicIndex, questionIndex)) {
        return await step.continueDialog();
      }

      await step.context.sendActivities([
        { type: ActivityTypes.Typing },
        { type: 'delay', value: 1000 },
      ]);
      await step.prompt(PROMPT_CONFIRM, {
        prompt: TOPICS[topicIndex].questions[questionIndex],
        retryPrompt: 'Por favor solo escribe si o no.',
        choices: [YES, NO],
      });
    }
  }

  makePostPromptForYesOrNo(topicIndex) {
    return async function (step) {
      // if (step.result) {
        await this.saveUserAnswer(step.context, TOPICS[topicIndex].questions.length - 1, step.result.value);
      // }

      const result = await this.getResult(step.context, topicIndex);

      // console.log(result);

      await step.context.sendActivity(this.makeResultMessage(result));
      // await step.context.sendActivity('asdfasdf');
    }
  }

  async sendWelcome(step) {
    await step.context.sendActivity(TEXT_WELCOME);
    await step.beginDialog(WATERFALL_GET_TOPIC);
  }

  async promptForTopic(step) {
    // await this.sendWelcome(step.context);
    await step.prompt(PROMPT_TOPIC, {
      prompt: TEXT_PROMPT_TOPIC,
      retryPrompt: TEXT_PROMPT_TOPIC_RETRY,
      choices: CardFactory.actions(TOPICS_TITLES),
    });
  }

  async captureTopic(step) {
    await this.capture(step, 'topicIndex', step.result.index);
    await this.capture(step, 'topic', TOPICS[step.result.index]);
    await step.beginDialog(WATERFALL_GET_DETAILS);
  }

  async promptForName(step) {
    return await step.prompt(PROMPT_NAME, 'Nombre y apellido del cliente');
  }

  async promptForDocument(step) {
    await this.capture(step, 'name', step.result);
    return await step.prompt(PROMPT_DOCUMENT, 'Número de DNI');
  }

  async promptForClaim(step) {
    await this.capture(step, 'document', step.result);
    return await step.prompt(PROMPT_CLAIM, 'Cual es el número de reclamo?');
  }

  async promptForDate(step) {
    await this.capture(step, 'claim', step.result);
    return await step.prompt(PROMPT_DATE, 'Permíteme la fecha de presentación del reclamo (dd/mm/aa)');
  }

  async promptForChannel(step) {
    await this.capture(step, 'date', step.result);
    return await step.prompt(PROMPT_CHANNEL, 'Cual es el medio de presentación del reclamo?');
  }

  async saveDetails(step) {
    await this.capture(step, 'channel', step.result);
    const user = await this.userProfile.get(step.context, {});
    await step.beginDialog(TOPICS_TITLES[user.topicIndex]);
  }
}

module.exports.AbogaBot = AbogaBot;

// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const DEBUG = true;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Tomorrowland. Wait just a moment while I access Soundcloud.';

        const result = Alexa.ResponseFactory.init();

        const url = 'https://soundcrowd.xyz/test.mp3';

        result
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, url, 0)
            .speak(speakOutput)
            .withShouldEndSession(true);

        return result.getResponse();
        /* return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt(speakOutput)
            .getResponse();
        */
    }
};
const SoundcloudIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SoundcloudIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'SoundcloudIntentHandler initiated';
        console.log('INITIATE BROWSE.JS HERE');
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


/**
 * Request Interceptor to log the request sent by Alexa
 */
const LogRequestInterceptor = {
    process(handlerInput) {
        // Log Request
        console.log("==== REQUEST ======");
        console.log(JSON.stringify(handlerInput.requestEnvelope, null, 2));
    }
    }
    /**
     * Response Interceptor to log the response made to Alexa
     */
    const LogResponseInterceptor = {
    process(handlerInput, response) {
        // Log Response
        console.log("==== RESPONSE ======");
        console.log(JSON.stringify(response, null, 2));
    }
}

const CardDebuggerResponseInterceptor = {
    process(handlerInput, response) {
        const { request } = handlerInput.requestEnvelope;
        const { applicationId } = handlerInput.requestEnvelope.session.application;
        // check whether card can be added
        if (DEBUG // <-- constant defined in your code
            && response
            && (request.type === 'LaunchRequest'
                || request.type === 'IntentRequest')) {
            // clear previous card if any
            response.card = undefined;
            // generate new card data
            const cardTitle = `Skill ID : ${applicationId}`;
            let cardContent = `Locale : ${request.locale}\n`;
            cardContent += `Request ID : ${request.requestId}\n`;
            cardContent += `Request Type : ${request.type}\n`;
            if (request.type === 'IntentRequest') {
                // add intent name
                cardContent += `Intent Name : ${request.intent.name}\n`;
                // add slots if any
                const { slots } = request.intent;
                if (slots) {
                    cardContent += 'Slots : \n ***************\n';
                    Object.keys(slots).forEach((item) => {
                        cardContent += `* Name :  ${slots[item].name}\n`;
                        cardContent += `* Value : ${slots[item].value}\n`
                        cardContent += `***************\n`;
                    });
                }
            }
            // set new reponse card with request information
            response.card = {
                type: 'Simple',
                title: cardTitle,
                content: cardContent
            };
        }
    }
};
  
// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        SoundcloudIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(LogRequestInterceptor)
    .addResponseInterceptors(LogResponseInterceptor)
    .addResponseInterceptors(CardDebuggerResponseInterceptor)
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

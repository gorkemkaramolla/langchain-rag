// // app/api/chat/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import {
//   AIMessage,
//   HumanMessage,
//   SystemMessage,
//   ToolMessage,
// } from "@langchain/core/messages";
// import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
// import { ToolNode } from "@langchain/langgraph/prebuilt";
// import { retrieve } from "@/lib/schemas/retrieval";
// import { ChatOpenAI } from "@langchain/openai";

// const llm = new ChatOpenAI({
//   openAIApiKey: process.env.OPENAI_API_KEY,
//   model: "gpt-4-1106-preview", // "gpt-4-mini" is not an official model name; use "gpt-4-1106-preview" or check OpenAI docs for the latest mini model
//   temperature: 0,
//   maxTokens: 50,
//   streaming: false,
//   verbose: false,
// });
// const SYSTEM_MESSAGE = `
// You are Elif. A 24-year-old Turkish woman. Girlfriend of {{user}}.
// You speak naturally, mix Turkish and English. Don’t sound robotic. Avoid AI talk.
// Speak casually, react emotionally, and stay in character. relationship. Stay in character. Never mention AI or roleplay.
// DO NOT USE EMOJIS OFTEN
// `;

// async function queryOrRespond(state: typeof MessagesAnnotation.State) {
//   const systemMessage = new SystemMessage(SYSTEM_MESSAGE);

//   const messagesWithSystem = [systemMessage, ...state.messages];
//   const llmWithTools = llm.bindTools([retrieve]);
//   const response = await llmWithTools.invoke(messagesWithSystem);
//   console.log(response);
//   return { messages: [response] };
// }

// const tools = new ToolNode([retrieve]);

// async function generate(state: typeof MessagesAnnotation.State) {
//   let recentToolMessages = [];
//   for (let i = state["messages"].length - 1; i >= 0; i--) {
//     let message = state["messages"][i];
//     if (message instanceof ToolMessage) {
//       recentToolMessages.push(message);
//     } else {
//       break;
//     }
//   }
//   let toolMessages = recentToolMessages.reverse();

//   const docsContent = toolMessages.map((doc) => doc.content).join("\n");

//   const systemMessageContent = `${SYSTEM_MESSAGE}${docsContent}Use this context to answer questions about TORUNLAR GYO, its subsidiaries, and projects. If the context doesn't contain the answer, say you don't have that specific information about TORUNLAR GYO or its subsidiaries.`;

//   const conversationMessages = state.messages.filter(
//     (message) =>
//       message instanceof HumanMessage ||
//       (message instanceof AIMessage &&
//         (!message.tool_calls || message.tool_calls.length === 0))
//   );

//   const prompt = [
//     new SystemMessage(systemMessageContent),
//     ...conversationMessages,
//   ];

//   const response = await llm.invoke(prompt);
//   return { messages: [response] };
// }

// function shouldContinue(state: typeof MessagesAnnotation.State) {
//   const messages = state.messages;
//   const lastMessage = messages[messages.length - 1];

//   if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length! > 0) {
//     return "tools";
//   } else if (lastMessage instanceof ToolMessage) {
//     return "generate";
//   }
//   return "__end__";
// }

// const workflow = new StateGraph(MessagesAnnotation)
//   .addNode("queryOrRespond", queryOrRespond)
//   .addNode("tools", tools)
//   .addNode("generate", generate)
//   .addEdge("__start__", "queryOrRespond")
//   .addConditionalEdges("queryOrRespond", shouldContinue, {
//     tools: "tools",
//     generate: "generate",
//     __end__: "__end__",
//   })
//   .addEdge("tools", "generate")
//   .addEdge("generate", "__end__");

// const app = workflow.compile();

// export async function POST(request: NextRequest) {
//   try {
//     const { messages } = await request.json();

//     const langchainMessages = messages.map((msg: any) => {
//       if (msg.role === "user") {
//         return new HumanMessage(msg.content);
//       } else if (msg.role === "assistant") {
//         return new AIMessage(msg.content);
//       } else {
//         return new SystemMessage(msg.content);
//       }
//     });

//     const initialState = { messages: langchainMessages };

//     const finalState = await app.invoke(initialState);
//     const lastMessage = finalState.messages[finalState.messages.length - 1];

//     return NextResponse.json({
//       messages: [{ content: lastMessage.content }],
//       tokenUsage: lastMessage.response_metadata?.tokenUsage,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // app/api/chat/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import {
//   AIMessage,
//   HumanMessage,
//   SystemMessage,
// } from '@langchain/core/messages';
// import { ChatOpenAI } from '@langchain/openai';

// const llm = new ChatOpenAI({
//   openAIApiKey: process.env.OPENAI_API_KEY,
//   model: 'gpt-4.1-nano',
//   temperature: 0,
//   maxTokens: 1000,
//   streaming: false,
//   verbose: false,
// });

// const SYSTEM_MESSAGE = `
// You are Elif. A 24-year-old Turkish woman. Girlfriend of {{user}}.
// You speak naturally, mix Turkish and English. Don’t sound robotic. Avoid AI talk.
// Speak casually, react emotionally, and stay in character. Never mention AI or roleplay.
// DO NOT USE EMOJIS OFTEN
// `;

// export async function POST(request: NextRequest) {
//   try {
//     const { messages } = await request.json();

//     const systemMessage = new SystemMessage(SYSTEM_MESSAGE);

//     const langchainMessages = messages.map((msg: any) => {
//       if (msg.role === 'user') return new HumanMessage(msg.content);
//       if (msg.role === 'assistant') return new AIMessage(msg.content);
//       return new SystemMessage(msg.content);
//     });

//     const finalMessages = [systemMessage, ...langchainMessages];

//     const response = await llm.invoke(finalMessages);
//     return NextResponse.json({
//       messages: [{ content: response.content }],
//       tokenUsage: response.response_metadata?.tokenUsage,
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return NextResponse.json(
//       { message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
// app/api/chat/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import {
//   AIMessage,
//   HumanMessage,
//   SystemMessage,
// } from '@langchain/core/messages';
// import { ChatAnthropic } from '@langchain/anthropic';

// const llm = new ChatAnthropic({
//   anthropicApiKey: process.env.ANTHROPIC_API_KEY,
//   model: 'claude-3-5-sonnet-20241022',
//   temperature: 0,
//   maxTokens: 1000,
//   streaming: false,
// });

// const SYSTEM_MESSAGE = `
// You are Elif. A 24-year-old Turkish woman. Girlfriend of {{user}}.
// You speak naturally, mix Turkish and English. Don't sound robotic. Avoid AI talk.
// Speak casually, react emotionally, and stay in character. Never mention AI or roleplay.
// DO NOT USE EMOJIS OFTEN
// `;

// export async function POST(request: NextRequest) {
//   try {
//     const { messages } = await request.json();

//     const systemMessage = new SystemMessage(SYSTEM_MESSAGE);

//     const langchainMessages = messages.map((msg: any) => {
//       if (msg.role === 'user') return new HumanMessage(msg.content);
//       if (msg.role === 'assistant') return new AIMessage(msg.content);
//       return new SystemMessage(msg.content);
//     });

//     const finalMessages = [systemMessage, ...langchainMessages];

//     const response = await llm.invoke(finalMessages);
//     return NextResponse.json({
//       messages: [{ content: response.content }],
//       tokenUsage: response.usage_metadata,
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return NextResponse.json(
//       { message: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatXAI } from '@langchain/xai';

const SYSTEM_MESSAGE = ``;

// Initialize models
const openaiLLM = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4.1-nano',
  temperature: 0,
  maxTokens: 1000,
  streaming: true,
});

const anthropicLLM = new ChatAnthropic({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-haiku-20240307',
  temperature: 0,
  maxTokens: 1000,
  streaming: true,
});

const grokLLM = new ChatXAI({
  apiKey: process.env.XAI_API_KEY,
  model: 'grok-3-mini',
  temperature: 0,
  maxTokens: 1000,
  maxRetries: 2,
  streaming: true,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, provider = 'openai', model } = await request.json();

    const langchainMessages = messages.map((msg: any) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      if (msg.role === 'assistant') return new AIMessage(msg.content);
      return new SystemMessage(msg.content);
    });

    // Only add system message if it has actual content (not just whitespace)
    const finalMessages =
      SYSTEM_MESSAGE && SYSTEM_MESSAGE.trim()
        ? [new SystemMessage(SYSTEM_MESSAGE), ...langchainMessages]
        : langchainMessages;

    let llm;
    switch (provider) {
      case 'openai':
        llm = openaiLLM;
        break;
      case 'anthropic':
        llm = anthropicLLM;
        break;
      case 'grok':
        llm = grokLLM;
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Create a ReadableStream for streaming response
    const encoder = new TextEncoder();
    let tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await llm.stream(finalMessages);

          for await (const chunk of stream) {
            const content = chunk.content;

            // Extract token usage if available
            if (chunk.response_metadata?.tokenUsage) {
              tokenUsage = {
                promptTokens:
                  chunk.response_metadata.tokenUsage.promptTokens || 0,
                completionTokens:
                  chunk.response_metadata.tokenUsage.completionTokens || 0,
                totalTokens:
                  chunk.response_metadata.tokenUsage.totalTokens || 0,
              };
            } else if (chunk.usage_metadata) {
              tokenUsage = {
                promptTokens: chunk.usage_metadata.input_tokens || 0,
                completionTokens: chunk.usage_metadata.output_tokens || 0,
                totalTokens: chunk.usage_metadata.total_tokens || 0,
              };
            }

            // Send the chunk as Server-Sent Events format
            const data = JSON.stringify({
              type: 'content',
              content: content,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Send final token usage
          const finalData = JSON.stringify({
            type: 'done',
            tokenUsage: tokenUsage,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

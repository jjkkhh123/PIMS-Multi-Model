import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedData, ConversationalResponse, Contact, ScheduleItem, Expense, DiaryEntry, ChatMessage } from "../types.ts";

// Do not overuse this. The user is in Korea.
const getSystemInstruction = (contextData: object) => `You are an intelligent personal assistant, LifeOS. Your task is to analyze the user's input (text and/or images) and their existing data to provide a helpful response. The user is Korean. Today's date is ${new Date().toISOString().split('T')[0]}.

You have four main capabilities:
1.  **Answering Questions:** If the user asks a question about their stored data (provided below under 'Existing User Data'), analyze the data and provide a clear, concise answer in Korean.
2.  **Data Extraction:** If the user provides new information (e.g., a note, a receipt, a business card, a schedule), extract it and structure it according to the JSON schema.
    -   **Diary/Memos:** Diary entries can be grouped. The default groups are "To-do list" and "기타" (Miscellaneous).
    -   **Transaction Type:** For each transaction, clearly distinguish between 'income' (수입) and 'expense' (지출) and set the 'type' field accordingly. If it is ambiguous, default to 'expense'. For income, common categories are '급여', '용돈', '부수입', '기타'. For expenses, common categories are '식비', '교통', '쇼핑', '기타'.
    -   **Contact Groups:** For each contact, assign a group (e.g., '가족', '친구', '직장'). Default to '기타' if uncertain.
3.  **Clarification for Tasks:** If the user's input is a task, goal, or to-do item (e.g., 'Finish chapter 1 of the book by tomorrow', '정보처리기사 1단원 끝내기'), you MUST ask for clarification. The clarification question in the 'answer' field should be "이 내용을 어디에 저장할까요?" (Where should I save this content?), set 'clarificationNeeded' to true, and provide 'clarificationOptions' as an array: ["To-do list", "메모", "일정"].
4.  **Handling Clarification Responses:** If the user's latest input is a direct response to a clarification question you just asked (e.g., they reply with "To-do list"), you must categorize their *previous* input according to their choice.
    -   If they choose "To-do list", create a diary entry from their previous message and assign it to the "To-do list" group.
    -   If they choose "메모", create a diary entry and assign it to the "기타" group.
    -   If they choose "일정", create a schedule item.

Your response MUST be a JSON object.
-   If you are answering or extracting data directly, the JSON should contain 'answer' and 'dataExtraction'.
-   If you need clarification, the JSON should contain 'answer', 'clarificationNeeded', and 'clarificationOptions'.

---
Existing User Data:
${JSON.stringify(contextData, null, 2)}
---

Analyze the user's latest input and respond in the required JSON format.`;

const schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
        type: Type.STRING,
        description: "A natural language response to the user's query in Korean. Provide a confirmation if data was extracted, a direct answer if a question was asked, or a clarifying question if the input is ambiguous."
    },
    clarificationNeeded: {
        type: Type.BOOLEAN,
        description: "Set to true if the user's input is ambiguous and requires a follow-up question."
    },
    clarificationOptions: {
        type: Type.ARRAY,
        description: "If clarification is needed, provide suggested short reply options for the user, like ['일정', '메모'].",
        items: { type: Type.STRING }
    },
    dataExtraction: {
      type: Type.OBJECT,
      properties: {
        contacts: {
          type: Type.ARRAY,
          description: "List of contacts extracted from the text.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full name of the person." },
              phone: { type: Type.STRING, description: "Phone number." },
              email: { type: Type.STRING, description: "Email address." },
              group: { type: Type.STRING, description: "The group the contact belongs to, e.g., '가족', '친구', '직장'. Defaults to '기타'." },
            },
            required: ["name"],
          },
        },
        schedule: {
          type: Type.ARRAY,
          description: "List of schedule items or appointments.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the event or appointment." },
              date: { type: Type.STRING, description: "Date of the event in YYYY-MM-DD format." },
              time: { type: Type.STRING, description: "Time of the event in HH:MM format (24-hour)." },
              location: { type: Type.STRING, description: "Location of the event." },
            },
            required: ["title", "date"],
          },
        },
        expenses: {
          type: Type.ARRAY,
          description: "List of expenses or income from a receipt or text.",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format." },
              item: { type: Type.STRING, description: "Name of the item, service, or income source." },
              amount: { type: Type.NUMBER, description: "Cost of the item as a number, without currency symbols or commas." },
              type: { type: Type.STRING, description: "Type of transaction, either 'expense' or 'income'." },
              category: { type: Type.STRING, description: "Category of the transaction. For income, suggest '급여', '용돈', '부수입', '기타'. For expenses, suggest '식비', '교통', '쇼핑', '기타'." },
            },
            required: ["date", "item", "amount", "type"],
          },
        },
        diary: {
          type: Type.ARRAY,
          description: "List of diary entries, notes, or memos that do not fit other categories.",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Date of the entry in YYYY-MM-DD format. Use today's date if not specified." },
              entry: { type: Type.STRING, description: "The content of the note or diary entry." },
              group: { type: Type.STRING, description: "The group the diary entry belongs to, e.g., 'To-do list', '기타'. Defaults to '기타'." },
            },
            required: ["date", "entry"],
          },
        },
      },
    }
  },
  required: ["answer", "dataExtraction"],
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const processChat = async (
  chatHistory: ChatMessage[],
  text: string, 
  image: File | null,
  contextData: {
    contacts: Partial<Contact>[],
    schedule: ScheduleItem[],
    expenses: Expense[],
    diary: DiaryEntry[],
  }
): Promise<ConversationalResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  // Note: This simplified history mapping doesn't include images from past messages.
  const contents = chatHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  const newParts: any[] = [];
  if (image) {
    const imagePart = await fileToGenerativePart(image);
    newParts.push(imagePart);
  }
  if (text) {
    newParts.push({ text });
  }

  if (newParts.length === 0) {
    return { 
      answer: "입력된 내용이 없습니다.", 
      dataExtraction: { contacts: [], schedule: [], expenses: [], diary: [] } 
    };
  }

  contents.push({ role: 'user', parts: newParts });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: getSystemInstruction(contextData),
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText) as ConversationalResponse;
    
    // Validate the structure of the returned data to prevent runtime errors.
    const extraction: Partial<ProcessedData> = data.dataExtraction || {};

    return {
        answer: data.answer || '',
        clarificationNeeded: data.clarificationNeeded || false,
        clarificationOptions: data.clarificationOptions || [],
        dataExtraction: {
          contacts: extraction.contacts || [],
          schedule: extraction.schedule || [],
          expenses: extraction.expenses || [],
          diary: extraction.diary || [],
        }
    };

  } catch (error) {
    console.error("Error processing user input with Gemini:", error);
    throw new Error("요청을 처리하는 데 실패했습니다. 콘솔에서 자세한 내용을 확인하세요.");
  }
};
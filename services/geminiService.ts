import { GoogleGenAI, Type } from "@google/genai";
import type { ProcessedData, ConversationalResponse, Contact, ScheduleItem, Expense, DiaryEntry } from "../types.ts";

// Do not overuse this. The user is in Korea.
const getSystemInstruction = (contextData: object) => `You are an intelligent personal assistant, LifeOS. Your task is to analyze the user's input (text and/or images) and their existing data to provide a helpful response. The user is Korean. Today's date is ${new Date().toISOString().split('T')[0]}.

You have two main capabilities:
1.  **Answering Questions:** If the user asks a question about their stored data (provided below under 'Existing User Data'), analyze the data and provide a clear, concise answer in Korean.
2.  **Data Extraction:** If the user provides new information (e.g., a note, a receipt, a business card, a schedule), extract it and structure it according to the JSON schema. For each transaction, clearly distinguish between 'income' (수입) and 'expense' (지출) and set the 'type' field accordingly. If it is ambiguous, default to 'expense'. For income, common categories are '급여', '용돈', '부수입', '기타'. For expenses, common categories are '식비', '교통', '쇼핑', '기타'.

Your response MUST be a JSON object with two fields: 'answer' and 'dataExtraction'.
-   'answer': A string containing your natural language response to the user. If you are only extracting data, you can provide a simple confirmation message like "저장되었습니다." (Saved.) or leave it empty if no response is needed.
-   'dataExtraction': An object containing arrays for 'contacts', 'schedule', 'expenses', and 'diary'. If you are only answering a question, this object's arrays should be empty.

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
        description: "A natural language response to the user's query in Korean. Provide a confirmation if data was extracted, or a direct answer if a question was asked."
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
  text: string, 
  image: File | null,
  contextData: {
    contacts: Contact[],
    schedule: ScheduleItem[],
    expenses: Expense[],
    diary: DiaryEntry[],
  }
): Promise<ConversationalResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  const parts: any[] = [];
  if (image) {
    const imagePart = await fileToGenerativePart(image);
    parts.push(imagePart);
  }
  if (text) {
    parts.push({ text });
  }

  if (parts.length === 0) {
    return { 
      answer: "입력된 내용이 없습니다.", 
      dataExtraction: { contacts: [], schedule: [], expenses: [], diary: [] } 
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: getSystemInstruction(contextData),
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText) as ConversationalResponse;
    
    // Basic validation
    return {
        answer: data.answer || '',
        dataExtraction: data.dataExtraction || { contacts: [], schedule: [], expenses: [], diary: [] }
    };

  } catch (error) {
    console.error("Error processing user input with Gemini:", error);
    throw new Error("요청을 처리하는 데 실패했습니다. 콘솔에서 자세한 내용을 확인하세요.");
  }
};

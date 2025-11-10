
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedData } from "../types.ts";

// Do not overuse this. The user is in Korea.
const SYSTEM_INSTRUCTION = `You are an intelligent personal assistant. Your task is to analyze the user's input, which may include text and images (like receipts or business cards), and extract structured information.
The user is Korean, so process Korean text and context appropriately.
Today's date is ${new Date().toISOString().split('T')[0]}. Use this as a reference if dates are relative (e.g., "tomorrow", "next Tuesday").
Categorize the information into one of four types: contacts, schedule, expenses, or diary.
- Contacts: Names, phone numbers, email addresses.
- Schedule: Appointments, events, deadlines with dates, times, and locations.
- Expenses: Transactions, including the item name, amount, and date. Try to infer a category. For each transaction, clearly distinguish between 'income' (수입) and 'expense' (지출) and set the 'type' field accordingly. If it is ambiguous, default to 'expense'. For income, common categories are '급여', '용돈', '부수입', '기타'. For expenses, common categories are '식비', '교통', '쇼핑', '기타'.
- Diary: General notes, ideas, or journal entries that don't fit into the other categories.
Return the extracted information in the specified JSON format. If no information for a category is found, return an empty array for it.`;

const schema = {
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

export const processUserInput = async (text: string, image: File | null): Promise<ProcessedData> => {
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
    return { contacts: [], schedule: [], expenses: [], diary: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      // Fix: Pass a single Content object for a single-turn request, which is clearer.
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText) as ProcessedData;
    
    // Basic validation
    return {
        contacts: data.contacts || [],
        schedule: data.schedule || [],
        expenses: data.expenses || [],
        diary: data.diary || [],
    };

  } catch (error) {
    console.error("Error processing user input with Gemini:", error);
    throw new Error("Failed to process request. Please check the console for details.");
  }
};

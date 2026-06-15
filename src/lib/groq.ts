import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

type OutputValue =
  | string
  | number
  | boolean
  | OutputValue[]
  | { [key: string]: OutputValue };

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "llama-3.3-70b-versatile",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
): Promise<OutputValue[] | OutputValue> {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output || list_input) {
      output_format_prompt = `\nYou are to output a JSON object with a "data" key containing an array of objects in the following format: ${JSON.stringify(
        output_format
      )}. \nDo not put quotation marks or escape character \\ in the output fields.`;
    }

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate one json object for each input element inside the "data" array.`;
    }

    output_format_prompt += `\n\nIMPORTANT: Respond ONLY with valid JSON. All keys and string values MUST be wrapped in double quotes. No markdown, no backticks, no explanations. Example: [{"key": "value"}]`;

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: system_prompt + output_format_prompt + error_msg,
          },
          {
            role: "user",
            content: user_prompt.toString(),
          },
        ],
        model: model,
        temperature: temperature,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      });

      let res: string = chatCompletion.choices[0]?.message?.content || "";

      // Clean up response - remove markdown code blocks
      res = res.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      res = res.trim();

      // Fix missing quotes around keys (common Groq issue)
      // Pattern: {key: -> {"key":
      res = res.replace(/\{(\w+):/g, '{"$1":');
      res = res.replace(/,\s*(\w+):/g, ', "$1":');

      // Find JSON in response (in case there's extra text)
      const jsonMatch = res.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        res = jsonMatch[0];
      }

      if (verbose) {
        console.log(
          "System prompt:",
          system_prompt + output_format_prompt + error_msg
        );
        console.log("\nUser prompt:", user_prompt);
        console.log("\nGroq raw response:", res);
      }

      let output: OutputValue[];

      try {
        const parsed = JSON.parse(res);
        // If response has "data" key (for arrays), extract it
        if (parsed.data && Array.isArray(parsed.data)) {
          output = parsed.data;
        } else if (Array.isArray(parsed)) {
          output = parsed;
        } else {
          output = [parsed];
        }
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", res);
        throw new Error(`Failed to parse JSON: ${res.substring(0, 200)}...`);
      }

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in an array of json");
        }
      } else {
        output = [output as OutputValue];
      }

      for (let index = 0; index < output.length; index++) {
        const currentOutput = output[index] as { [key: string]: OutputValue };

        for (const key in output_format) {
          if (/<.*?>/.test(key)) {
            continue;
          }

          if (!(key in currentOutput)) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            if (Array.isArray(currentOutput[key])) {
              currentOutput[key] = (currentOutput[key] as OutputValue[])[0];
            }
            if (
              !choices.includes(currentOutput[key] as string) &&
              default_category
            ) {
              currentOutput[key] = default_category;
            }
            if (
              typeof currentOutput[key] === "string" &&
              (currentOutput[key] as string).includes(":")
            ) {
              currentOutput[key] = (currentOutput[key] as string).split(":")[0];
            }
          }
        }

        if (output_value_only) {
          const values = Object.values(currentOutput);
          output[index] = values.length === 1 ? values[0] : values;
        }
      }

      return list_input ? output : output[0];
    } catch (e: unknown) {
      const error = e as Error;
      error_msg = `\n\nResult: ${error.message}\n\nError message: ${error.message}`;
      console.log("An exception occurred:", error);

      if (i === num_tries - 1) {
        throw error;
      }
    }
  }

  return [];
}

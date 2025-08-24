"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { messageSchema } from "@/schemas/messageSchema";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { toast } from "sonner";
import { useState } from "react";
import { usePathname } from "next/navigation";

const page = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestMessageTopic, setSuggestMessageTopic] = useState("");
  const [suggestedMessages, setSuggestedMessages] = useState([]);

  // zod implements
  const register = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  // username from url
  const pathname = usePathname();
  const username = pathname.split("/")[2];

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>("/api/send-message", {
        username: username,
        content: data.content,
      });
      toast.success(response.data.message);
      setIsSubmitting(false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Error sending message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calledSuggestMessage = async () => {
    try {
      const response = await axios.post("/api/suggest-messages", {
        text: suggestMessageTopic,
      });
      // console.log("Suggested questions:", response.data);

      setSuggestedMessages(response.data.split("||"));
    } catch (error) {
      console.error("Error fetching suggested questions:", error);
    }
  };

  return (
    <section>
      <Form {...register}>
        <form onSubmit={register.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            name="content"
            control={register.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Content" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </Form>

      <input
        type="text"
        value={suggestMessageTopic}
        onChange={(e) => setSuggestMessageTopic(e.target.value)}
        placeholder="Enter topic for suggestions"
      />
      <Button onClick={calledSuggestMessage}>Get Suggested Messages</Button>

      <div>
        {suggestedMessages.map((data, i) => (
          <div key={i}>{data}</div>
        ))}
      </div>
    </section>
  );
};

export default page;

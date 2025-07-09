'use client';
import React, { useState, useRef, useEffect } from 'react';

export const Chatbot = () => {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSubmit = async () => {
    if (message.trim()) {
      const userMessage = message;
      setChat((prevChat) => [...prevChat, { type: 'user', text: userMessage }]);
      setMessage('');
      setIsLoading(true);
      await sendMessageToFlask(userMessage);
    }
  };

  const sendMessageToFlask = async (userMessage) => {
    try {
      const response = await fetch('http://localhost:5050/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botReply = '';

      setChat((prevChat) => [...prevChat, { type: 'bot', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botReply += decoder.decode(value, { stream: true });
        setChat((prev) =>
          prev.map((c, i) =>
            i === prev.length - 1 ? { ...c, text: botReply } : c
          )
        );
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setChat((prevChat) => [
        ...prevChat,
        { type: 'bot', text: `🚨 Chatbot backend error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setChat((prevChat) => [
        ...prevChat,
        {
          type: 'user',
          text: (
            <img
              src={reader.result}
              alt="Uploaded"
              className="max-w-[150px] h-auto rounded-lg"
            />
          ),
        },
      ]);
      setIsLoading(true);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('http://localhost:5050/classify', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to classify image.');

        const result = await response.json();
        const dishName = result.dishName;

        setChat((prevChat) => [
          ...prevChat,
          { type: 'bot', text: `Identified by ViT: Looks like ${dishName}!` },
        ]);

        await sendMessageToFlask(dishName);
      } catch (err) {
        console.error('Image upload error', err);
        setChat((prevChat) => [
          ...prevChat,
          {
            type: 'bot',
            text: `❌ Error processing image: ${err.message}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center mt-[40px] mb-[20px] mx-[10px] h-dvh">
      <div className="border-[4px] border-blue-300 rounded-[12px] p-[10px] w-[80vw] max-w-[100vw] h-auto flex flex-col justify-between min-h-[440px] text-neutral-100">
        <div
          ref={chatContainerRef}
          className="flex flex-col gap-[10px] max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        >
          {chat.map((entry, index) => (
            <div
              key={index}
              className={`mb-[10px] p-[10px] rounded-[10px] max-w-[70%] text-xs break-words ${
                entry.type === 'user'
                  ? 'self-end bg-blue-500 text-white'
                  : 'self-start bg-gray-200 text-black'
              }`}
            >
              {entry.text}
            </div>
          ))}
          {isLoading && (
            <div className="self-start text-black p-2 rounded-md flex items-center">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-black rounded-full"></div>
                <div className="h-2 w-2 bg-black rounded-full"></div>
                <div className="h-2 w-2 bg-black rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center items-center gap-[20px] mt-[20px]">
          <input
            type="text"
            placeholder="Enter the food name"
            value={message}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            onChange={(e) => setMessage(e.target.value)}
            className="border rounded-[10px] p-[10px] text-xs lg:w-[200px] outline-none text-black"
          />
          <div className="flex gap-[10px]">
            <button
              onClick={handleSubmit}
              className="border rounded-[10px] p-[10px] text-xs cursor-pointer bg-blue-500"
            >
              Submit
            </button>
            <label className="border rounded-[10px] p-[10px] text-black text-xs cursor-pointer">
              <img src="./upload.jpg" width={20} height={20} alt="Upload" />
              <input
                type="file"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

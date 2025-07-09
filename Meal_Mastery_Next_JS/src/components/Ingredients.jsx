'use client';
import React, { useState, useEffect, useRef } from 'react';

export const IngredientChatbot = () => {
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
      setChat(prev => [...prev, { type: 'user', text: userMessage }]);
      setMessage('');
      setIsLoading(true);

      setTimeout(() => {
        setChat(prev => [...prev, { type: 'bot', text: 'Analyzing your food item...' }]);
        generateRecipeFromFlask(userMessage);
      }, 1000);
    }
  };

  const generateRecipeFromFlask = async (dishName) => {
    try {
      const response = await fetch('http://localhost:5050/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: dishName }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botReply += decoder.decode(value, { stream: true });
        setChat(prev => [...prev.slice(0, -1), { type: 'bot', text: botReply }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChat(prev => [...prev, { type: 'bot', text: '🚨 Error communicating with chatbot. Try again!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setChat(prev => [
        ...prev,
        {
          type: 'user',
          text: (
            <img
              src={reader.result}
              alt="uploaded"
              className="max-w-[300px] h-auto rounded-lg shadow-md"
            />
          ),
        },
      ]);
      setIsLoading(true);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('http://localhost:5050/detect_ingredients', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          setChat(prev => [...prev, { type: 'bot', text: "Sorry, something went wrong while detecting ingredients." }]);
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        console.log("Detection result:", result);

        if (result.message) {
          setChat(prev => [...prev, { type: 'bot', text: result.message }]);
        } else if (result.ingredients_detected || result.ingredients) {
          const detectedIngredients = result.ingredients_detected || result.ingredients || [];
          if (detectedIngredients.length > 0) {
            const ingredientsText = detectedIngredients.join(", ");
            setChat(prev => [...prev, { type: 'bot', text: `By using YOLO, I found the following ingredient(s): ${ingredientsText}` }]);

            // 👉 Generate recipe using those ingredients
            setTimeout(() => {
              setChat(prev => [...prev, { type: 'bot', text: 'Generating recipe from ingredients...' }]);
              generateRecipeFromFlask(ingredientsText);
            }, 1000);
          }
        }

        if (result.recipe) {
          setTimeout(() => {
            setChat(prev => [...prev, { type: 'bot', text: result.recipe }]);
          }, 500);
        } else if (result.text) {
          setTimeout(() => {
            setChat(prev => [...prev, { type: 'bot', text: result.text }]);
          }, 500);
        }

      } catch (err) {
        console.error("Error during ingredient detection:", err.message);
        setChat(prev => [...prev, { type: 'bot', text: "There was an error processing the image for ingredient detection." }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className='flex flex-col items-center mt-[40px] mb-[100px] mx-[10px] h-dvh'>
      <div className='border rounded-[12px] p-[10px] w-[80vw] max-w-[100vw] h-auto flex flex-col justify-between min-h-[440px] text-neutral-100'>
        <div
          ref={chatContainerRef}
          className='flex flex-col gap-[10px] max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'
        >
          {chat.map((entry, index) => (
            <div
              key={index}
              className={`mb-[10px] p-[10px] rounded-[10px] max-w-[70%] ${
                entry.type === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-200 text-black'
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

        <div className='flex justify-center items-center gap-[20px] mt-[20px]'>
          <input
            type='text'
            placeholder='Enter the ingredients or the food'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className='border rounded-[10px] p-[10px] text-[14px] lg:w-[200px] outline-none text-black'
          />
          <div className='flex gap-[10px]'>
            <button
              onClick={handleSubmit}
              className='border rounded-[10px] p-[10px] text-[14px] cursor-pointer bg-blue-500'
            >
              Submit
            </button>
            <label className='border rounded-[10px] p-[10px] text-[14px] cursor-pointer'>
              <img src="./upload.jpg" width={20} height={20} alt="upload icon" />
              <input type="file" onChange={handleImageUpload} className='hidden' />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientChatbot;

'use client'
import React, { useState, useEffect, useRef } from 'react';

// 1. ChatMessage component
function ChatMessage({ author, content, isComplete, isUser }) {
  const getAvatarColor = (name) => {
    const colors = {
      'Archivist': 'bg-blue-500',
      'Historian': 'bg-green-500', 
      'Geographer': 'bg-purple-500'
    };
    return colors[name] || 'bg-gray-500';
  };

  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="flex-1">
        <div className="text-gray-300 font-semibold text-xl font-helvetica mb-1 uppercase">{author}</div>
        <div className={`rounded-lg p-4 mt-1 ${isUser ? 'bg-gray-200' : 'bg-gray-800'}`}>
          <p className={`whitespace-pre-wrap text-lg leading-relaxed ${isUser ? 'text-black font-helvetica' : 'text-gray-100 font-serif'}`}>
            {content}
            {!isComplete && (
              <span className="inline-block w-1 h-5 ml-1 bg-gray-300 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// 2. ChatInterface component
// Manages the chat interface, handles audio playback, and renders the chat messages
function ChatInterface() {
  // State variables
  const [messages, setMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [currentText, setCurrentText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentImage, setCurrentImage] = useState('/dorn-manifesto.jpg');
  // Ref variables
  const chatContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioRef = useRef(null);

  // Conversation data
  const conversation = [
    {
      id: "Archivist_1",
      author: "Archivist",
      content: "This is the 'Doorn Manifesto,' a typed manuscript by Alison and Peter Smithson prepared for CIAM 10. The document measures 253 × 205 mm, with black typeface and extensive graphite annotations. What's particularly notable is the bottom section containing valley-section diagrams that explicitly reference Patrick Geddes' work, though with significant simplification. The marginalia suggests multiple revision sessions, with at least three different handwriting styles visible. The document's condition indicates it is a working paper rather than being a presentation copy."
    },
    {
      id: "Archivist_1_Q",
      author: "Archivist",
      content: "What else do you see here?"
    },
    {
      id: "User_1",
      author: "User",
      content: "I see a document with some notes, and a diagram with a sketch of different types of buildings.",
      typing: true
    },
    {
      id: "Historian_1",
      author: "Historian", 
      content: "But what does it mean? This manifesto represents more than just an ideological shift—it's a fundamental crisis in modernist thinking. The Smithsons are essentially declaring the bankruptcy of CIAM's entire methodological framework while paradoxically using its tools. Their rejection of the Athens Charter isn't merely a critique; it's an admission of modernism's failure to create meaningful human environments. It's ironic they're using a manifesto—the most modernist of formats—to declare the death of modernist planning principles.\nTheir emphasis on 'habitat' isn't just a new lens—it's a confession that Le Corbusier's 'machine for living' has produced mechanical environments devoid of human warmth."
    },
    {
      id: "Geographer_1",
      author: "Geographer",
      content: "Let's be honest about what's showing in this document. The Smithsons' valley section diagram isn't just simplified—it's dangerously reductive. They're trying to map complex social relationships onto physical space as if human communities can be understood through topographical sections.\nThe tension is between the reality of how cities actually function and the persistent fantasy that we can somehow plan our way to better communities."
    },
    {
      id: "User_2",
      author: "Geographer",
      content: "What do you think about this proposal?",
      typing: true
    },
    {
      id: "Archivist_2",
      author: "Archivist",
      content: "It's interesting that the document shows multiple revision phases. The paper stock is consistent with other CIAM documents from this period, suggesting it was part of a larger collection of working papers. The creases indicate regular handling during working sessions."
    },
    {
      id: "Historian_2",
      author: "Historian",
      content: "But the document's physical attributes matter less than its role in marking the death of a certain kind of architectural thinking."
    },
    {
      id: "Archivist_3",
      author: "Archivist",
      content: "This manifesto raises foundational questions about habitat, relationships, and community. To extend this conversation, I propose examining the Kennemerland Residential Construction Model from the same period. It is a physical representation of these ideas, visualizing a planned community within a polder landscape. The model presents high-rise buildings, multi-story housing, and single-family homes, organized around central amenities like schools and shops. It was showcased at the CIAM Otterlo congress in 1959, connecting the theoretical ambitions of documents like the Doorn Manifesto to tangible, constructed forms of habitat."
    },
    {
      id: "Archivist_3_Q",
      author: "User",
      content: "What else do you see here?",
      typing: true
    },
    {
      id: "User_3",
      author: "User",
      content: "I see a colorful model, that reminds me of a children's game. It looks very serene and nice",
      typing: true
    },
    {
      id: "Historian_3",
      author: "Historian",
      content: "The Kennemerland model could be seen as a direct response to the manifesto's call for 'habitat'—a layered system of relationships between architecture, community, and landscape. These neatly arranged housing types, centralized facilities, and rectilinear layouts speak of efficiency and control, yet one wonders: Where is the individual in this habitat?"
    },
    {
      id: "Geographer_2",
      author: "Geographer",
      content: "This model, when placed within a polder - the ultimate abstraction of nature, terraformed into a blank slate for human settlement. Yet, this blankness is an illusion. The reclaimed land requires constant maintenance—pumps, dikes, and canals—to remain viable. How does this fragile, artificial landscape shape the community that inhabits it?"
    },
    {
      id: "Archivist_4",
      author: "Archivist",
      content: "These are important questions, and perhaps the model can help us find some answers—or at least better articulate the challenges. The Kennemerland model is not just an artifact of design but a tool for imagining a new kind of habitat, one that grapples with the interaction of architecture, community, and the transformed landscape of the polder. Let us examine it together.\nDescribe to me the impression you get from it?"
    },
    {
      id: "Archivist_4_Q",
      author: "Archivist",
      content: "Describe to me - what is the impression you get from it?"
    }
  ];

  // 3. handleStart function
  // Starts the conversation when the "Start Conversation" button is clicked
  const handleStart = () => {
    setHasStarted(true);
    setCurrentMessageIndex(0);
  };

  // 4. playMessageSound function
  // Plays the audio for the current message
  const playMessageSound = async (author, messageIndex) => {
    const currentMessage = conversation[messageIndex];
    if (!currentMessage.id) return;

    const soundFile = `/audio/${currentMessage.id}.mp3`;
    console.log('Attempting to play:', soundFile);

    try {
      const audio = new Audio(soundFile);
      audioRef.current = audio;

      audio.addEventListener('loadstart', () => console.log('Audio loading started'));
      audio.addEventListener('loadeddata', () => console.log('Audio data loaded'));
      audio.addEventListener('canplay', () => console.log('Audio can play'));
      audio.addEventListener('error', (e) => console.error('Audio error:', e));
      audio.addEventListener('play', () => console.log('Audio playback started'));
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration * 1000;
        console.log('Audio duration:', duration, 'ms');
        setAudioDuration(duration);
      });

      audio.volume = 0.5;
      await audio.play();
      console.log('Audio playing successfully');
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  // 5. scrollToBottom function
  // Scrolls the chat container to the bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current;
      const scrollHeight = scrollContainer.scrollHeight;
      const height = scrollContainer.clientHeight;
      const maxScrollTop = scrollHeight - height;
      scrollContainer.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  };
  const handleImageTransition = (newImage) => {
    setCurrentImage(newImage);
  };
  // 6. useEffect hook
  // Handles the typing effect and audio playback
  useEffect(() => {
    if (currentMessageIndex >= conversation.length) return;
    if (currentMessageIndex === -1) return;
  
    const currentMessage = conversation[currentMessageIndex];
  
    if (charIndex === 0) {
      playMessageSound(currentMessage.author, currentMessageIndex);
    }
  
    if (charIndex >= currentMessage.content.length) {
      timeoutRef.current = setTimeout(() => {
        setCurrentMessageIndex((prev) => prev + 1);
        setCharIndex(0);
        setCurrentText('');
        setAudioDuration(null);
      }, currentMessage.typing ? 2000 : 3000);
      return;
    }
  
    // Trigger image transition when id: "Archivist_3" appears
    if (currentMessage.id === 'Archivist_3') {
      handleImageTransition('/kennemerland-model.png'); // Replace with the actual image path
    }
  
    // TYPING SPEED ADJUSTMENT SECTION
    let delay;
    const speedMultiplier = 0.2; // Global speed control: lower = faster
    const variationFactor = 0.6; // Increase this for more pronounced speed variations
  
    if (currentMessage.typing) {
      // User typing effect with slower speed and random variations
      delay = 120 * (0.8 + Math.random() * variationFactor);
    } else if (audioDuration) {
      // Calculate the base delay to match typing duration with audio duration
      const baseDelay = audioDuration / currentMessage.content.length;
  
      // Add larger randomality to the delay (between 0.5 and 1.5 times the base delay)
      const randomFactor = 0.5 + Math.random() * variationFactor;
      delay = baseDelay * randomFactor;
  
      // Add longer pauses for punctuation
      const char = currentMessage.content[charIndex];
      if (['.', '!', '?'].includes(char)) {
        delay *= 2;
      } else if ([',', '—'].includes(char)) {
        delay *= 1.5;
      }
  
      // More frequent and larger random pauses
      if (Math.random() < 0.05) {
        delay *= 2.5;
      }
    } else {
      // Default typing speed if no audio (with larger variations)
      delay = 30 * (0.5 + Math.random() * variationFactor);
  
      // Add pauses for punctuation
      const char = currentMessage.content[charIndex];
      if (['.', '!', '?'].includes(char)) {
        delay *= 2;
      } else if ([',', '—'].includes(char)) {
        delay *= 1.5;
      }
  
      // Random pauses
      if (Math.random() < 0.05) {
        delay *= 2.5;
      }
    }
  
    timeoutRef.current = setTimeout(() => {
      setCurrentText((prev) => prev + currentMessage.content[charIndex]);
      setCharIndex((prev) => prev + 1);
      scrollToBottom();
    }, delay);
  
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentMessageIndex, charIndex, conversation, audioDuration]);
  // 7. getCurrentMessages function
const getCurrentMessages = () => {
  if (currentMessageIndex === -1) return [];
  
  const completeMessages = conversation.slice(0, currentMessageIndex).map(msg => ({
    ...msg,
    isComplete: true,
    isUser: msg.author === 'User'
  }));

  if (currentMessageIndex < conversation.length) {
    return [
      ...completeMessages,
      {
        author: conversation[currentMessageIndex].author,
        content: currentText,
        isComplete: false,
        isUser: conversation[currentMessageIndex].author === 'User'
      }
    ];
  }

  return completeMessages;
};
 // 8. JSX
return (
  <div className="flex h-screen bg-black">
    <div className="w-1/2 bg-black relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={currentImage}
          alt="Conversation image"
          className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: hasStarted ? 1 : 0 }}
        />
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      {!hasStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white text-sm mb-4 text-center px-8">
            Explore an intriguing conversation between an Archivist, a Historian, and a Geographer as they delve into the Doorn Manifesto and its implications for architecture and urban planning.
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-gray-800 text-white rounded-lg text-lg hover:bg-gray-700 transition-colors font-courier"
          >
            Load Object from Archive
          </button>
        </div>
      )}
    </div>
    <div 
      ref={chatContainerRef}
      className="w-1/2 bg-black p-8 overflow-y-auto scroll-smooth"
    >
      <div className="max-w-2xl mx-auto">
        {getCurrentMessages().map((msg, idx) => (
          <ChatMessage 
            key={idx}
            author={msg.author}
            content={msg.content}
            isComplete={msg.isComplete}
            isUser={msg.isUser}
          />
        ))}
      </div>
    </div>
  </div>
);
}

export default ChatInterface;
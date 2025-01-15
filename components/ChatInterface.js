'use client'
import React, { useState, useEffect, useRef } from 'react';
import '@/styles/globals.css';  // Add this import with the @/ prefix

// LoadingAnimation component - updated styles for right side

function LoadingAnimation({ size = "small" }) {
  const dotSize = size === "large" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex space-x-4">
        <div className={`${dotSize} bg-white rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
        <div className={`${dotSize} bg-white rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
        <div className={`${dotSize} bg-white rounded-full animate-bounce`}></div>
      </div>
    </div>
  );
}
// TypingIndicator component
function TypingIndicator() {
  return (
    <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
      <div className="w-5 h-5 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-red-500 text-lg font-bold uppercase">Uploading</span>
    </div>
  );
}

// ProcessingAnimation component
function ProcessingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex space-x-3">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      </div>
      <div className="text-gray-400">Processing conversation...</div>
    </div>
  );
}


// 1. ChatMessage component

function ChatMessage({ author, content, isComplete, isUser }) {
  const getMessageStyle = (author) => {
    const styles = {
      'RAM': 'bg-blue-900 rounded-lg',    // Changed from 'Archivist'
      'OLA': 'bg-red-900 rounded-lg',     // Changed from 'Historian'
      'JON': 'bg-green-900 rounded-lg',   // Changed from 'Geographer'
      'User': 'bg-gray-200 rounded-lg'
    };
    return styles[author] || 'bg-gray-800 rounded-lg';
  };

  // Also update how the author name is displayed
  const getDisplayName = (author) => {
    const names = {
      'RAM': 'RAM (The Archivist)',
      'OLA': 'OLA (The Historian)',
      'JON': 'JON (The Geographer)',
      'User': 'YOU (A User Observer)'
    };
    return names[author] || author;
  };

  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="flex-1">
        <div className={`text-gray-300 font-semibold text-xl font-helvetica mb-1 uppercase
          ${isUser ? 'text-right' : ''}`}>
          {getDisplayName(author)}
        </div>
        <div className="flex flex-col">
          <div className={`p-4 mt-1 ${getMessageStyle(author)}`}>
            <p className={`whitespace-pre-wrap text-lg leading-relaxed 
              ${isUser ? 'text-black font-helvetica' : 'text-gray-100 font-serif'}`}>
              {content}
              {!isComplete && (
                <span className="inline-block w-1 h-5 ml-1 bg-gray-300 animate-pulse" />
              )}
            </p>
          </div>
          {isUser && !isComplete && (
            <div className="mt-2 flex justify-end">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 transition-colors font-helvetica"
              >
                Submit
              </button>
            </div>
          )}
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
  const [previousImage, setPreviousImage] = useState(null);
const [isFading, setIsFading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);  // New state
  const [imageLoaded, setImageLoaded] = useState(false);    // New state
  const [isLoading, setIsLoading] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);


  // Ref variables
  const chatContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioRef = useRef(null);

  // Conversation data
  const conversation = [
    {
      id: "Archivist_1",
       author: "RAM",
      content: "This is the 'Doorn Manifesto,' a typed manuscript by Alison and Peter Smithson prepared for CIAM 10. The document measures 253 × 205 mm, with black typeface and extensive graphite annotations. What's particularly notable is the bottom section containing valley-section diagrams that explicitly reference Patrick Geddes' work, though with significant simplification. The marginalia suggests multiple revision sessions, with at least three different handwriting styles visible. The document's condition indicates it is a working paper rather than being a presentation copy."
    },
    {
      id: "Archivist_1_Q",
       author: "RAM",
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
      author: "OLA",
      content: "But what does it mean? This manifesto represents more than just an ideological shift—it's a fundamental crisis in modernist thinking. The Smithsons are essentially declaring the bankruptcy of CIAM's entire methodological framework while paradoxically using its tools. Their rejection of the Athens Charter isn't merely a critique; it's an admission of modernism's failure to create meaningful human environments. It's ironic they're using a manifesto—the most modernist of formats—to declare the death of modernist planning principles.\nTheir emphasis on 'habitat' isn't just a new lens—it's a confession that Le Corbusier's 'machine for living' has produced mechanical environments devoid of human warmth."
    },
    {
      id: "Geographer_1",
       author: "JON",
      content: "Let's be honest about what's showing in this document. The Smithsons' valley section diagram isn't just simplified—it's dangerously reductive. They're trying to map complex social relationships onto physical space as if human communities can be understood through topographical sections.\nThe tension is between the reality of how cities actually function and the persistent fantasy that we can somehow plan our way to better communities."
    },
    {
      id: "Geographer_1_Q",
       author: "JON",
      content: "What do you think about this proposal?"
    },
    {
      id: "User_2",
      author: "User",
      content: "It is still difficult for me to understand, it seems like a draft for a concept",
      typing: true
    },
    {
      id: "Archivist_2",
       author: "RAM",
      content: "It's interesting that the document shows multiple revision phases. The paper stock is consistent with other CIAM documents from this period, suggesting it was part of a larger collection of working papers. The creases indicate regular handling during working sessions."
    },
    {
      id: "Historian_2",
      author: "OLA",
      content: "But the document's physical attributes matter less than its role in marking the death of a certain kind of architectural thinking."
    },
    {
      id: "Archivist_3",
       author: "RAM",
      content: "This manifesto raises foundational questions about habitat, relationships, and community. To extend this conversation, I propose examining the Kennemerland Residential Construction Model from the same period. It is a physical representation of these ideas, visualizing a planned community within a polder landscape. The model presents high-rise buildings, multi-story housing, and single-family homes, organized around central amenities like schools and shops. It was showcased at the CIAM Otterlo congress in 1959, connecting the theoretical ambitions of documents like the Doorn Manifesto to tangible, constructed forms of habitat."
    },
    {
      id: "Archivist_3_Q",
       author: "RAM",
      content: "What else do you see here?"
    },
    {
      id: "User_3",
      author: "User",
      content: "I see a colorful model, that reminds me of a children's game. It looks very neat and organized",
      typing: true
    },
    {
      id: "Historian_3",
      author: "OLA",
      content: "The Kennemerland model could be seen as a direct response to the manifesto's call for 'habitat'—a layered system of relationships between architecture, community, and landscape. These neatly arranged housing types, centralized facilities, and rectilinear layouts speak of efficiency and control, yet one wonders: Where is the individual in this habitat?"
    },
    {
      id: "Geographer_2",
       author: "JON",
      content: "This model, when placed within a polder - the ultimate abstraction of nature, terraformed into a blank slate for human settlement. Yet, this blankness is an illusion. The reclaimed land requires constant maintenance—pumps, dikes, and canals—to remain viable. How does this fragile, artificial landscape shape the community that inhabits it?"
    },
    {
      id: "Archivist_4",
       author: "RAM",
      content: "These are important questions, and perhaps the model can help us find some answers—or at least better articulate the challenges. The Kennemerland model is not just an artifact of design but a tool for imagining a new kind of habitat, one that grapples with the interaction of architecture, community, and the transformed landscape of the polder. Let us examine it together.\nDescribe to me the impression you get from it?"
    },
    {
      id: "Archivist_4_Q",
       author: "RAM",
      content: "Describe to me - what is the impression you get from it?"
    }
  ];

  // 3. handleStart function
  // Starts the conversation when the "Start Conversation" button is clicked
  // Modified handleStart function
  const handleStart = async () => {
    setShowWelcome(false);
    setIsLoading(true);

    try {
      // First loading phase with image (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      setHasStarted(true);

      // Second processing phase (3 seconds)
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsProcessing(false);

      // Start the conversation
      setCurrentMessageIndex(0);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsLoading(false);
      setIsProcessing(false);
    }
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
    setPreviousImage(currentImage);
    setIsFading(true);
  
    setTimeout(() => {
      setCurrentImage(newImage);
      setIsFading(false);
      setTimeout(() => {
        setPreviousImage(null);
      }, 1000);
    }, 1000);
  };
  // 6. useEffect hook
// 6. useEffect hook
useEffect(() => {
  if (currentMessageIndex >= conversation.length) return;
  if (currentMessageIndex === -1) return;

  const currentMessage = conversation[currentMessageIndex];  // Move this up
  
  // Set user typing state
  setIsUserTyping(currentMessage.author === 'User');

  // Single image transition check
  if (currentMessage.id === 'Archivist_3' && !hasTransitioned) {
    const triggerPhrase = "I propose examining";
    const currentContent = currentText;
    if (currentContent.includes(triggerPhrase)) {
      handleImageTransition('/kennemerland-model.png');
      setHasTransitioned(true);  // Prevent multiple transitions
    }
  }

  if (charIndex === 0) {
    playMessageSound(currentMessage.author, currentMessageIndex);
  }

  if (charIndex >= currentMessage.content.length) {
    timeoutRef.current = setTimeout(() => {
      setCurrentMessageIndex((prev) => prev + 1);
      setCharIndex(0);
      setCurrentText('');
      setAudioDuration(null);
      setIsUserTyping(false); // Reset typing state when message is complete
    }, currentMessage.typing ? 2000 : 3000);
    return;
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
}, [currentMessageIndex, charIndex, conversation, audioDuration, currentText, hasTransitioned]); // Added missing dependencies

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
  // 8. JSX
  return (
    <div className="flex h-screen bg-black">
      {/* Left side - Content */}
      <div
        ref={chatContainerRef}
        className="w-1/2 bg-black p-8 overflow-y-auto scroll-smooth scroll-container"
      >

        <div className="scroll-content">
          {!hasStarted ? (
            <div className="text-white max-w-2xl scroll-content">
              {/* Header */}
              <h2 className="text-4xl font-bold mb-6 text-left">Dialogue Archive: What do you see?</h2>

              {/* Framework Overview */}
              <div className="text-2xl font-bold mb-6 text-left">


                This AI dialogue explores a real-time and non=linear exploration of the Het Nieuwe Instituut's digital archive through three distinct perspectives, each embodied by a specialized AI agent. Together, they engage with human observers to develop deeper understanding of archival materials and their broader context.

              </div>

              {/* Two Column Layout */}
              <div className="flex gap-4">
                {/* Left Column */}
                <div className="w-1/2 space-y-4">
                  {/* AI Agents */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-left">The Agents</h3>



                    <div className="bg-blue-900/50 p-3">
                      <h4 className="text-md font-semibold text-left">RAM (The Archivist )</h4>
                      <h4 className="text-md font-semibold text-left">trained on</h4>
                      <ul className="list-disc ml-4 mt-1 space-y-1 text-left text-sm">
                        <li>Metadata from the New Institute online archive</li>
                        <li>Materialist and literal</li>

                        <button
                          className="px-3 py-1 border border-blue-300 text-blue-300 hover:bg-blue-800 hover:border-blue-200 hover:text-blue-100 rounded transition-all duration-200 focus:outline-none"
                          onClick={() => {/* handle click */ }}
                        >
                          Load more items from the collection
                        </button>
                      </ul>

                    </div>

                    <div className="bg-red-900/50 p-3">
                      <h4 className="text-md font-semibold text-left">OLA (The Historian)</h4>
                      <h4 className="text-md font-semibold text-left">trained on</h4>
                      <ul className="list-disc ml-4 mt-1 space-y-1 text-left text-sm">
                        <li>Selection of books and essay</li>
                        <li>Striving for deeper meaning, reflective, and critical</li>

                        <button
                          className="px-3 py-1 border border-red-300 text-red-300 hover:bg-red-800 hover:border-red-200 hover:text-red-100 rounded transition-all duration-200 focus:outline-none"
                          onClick={() => {/* handle click */ }}
                        >
                          Load more historical context
                        </button>


                      </ul>
                    </div>

                    <div className="bg-green-900/50 p-3">
                      <h4 className="text-md font-semibold text-left">JON (The Geographer)</h4>
                      <h4 className="text-md font-semibold text-left">trained on</h4>
                      <ul className="list-disc ml-4 mt-1 space-y-1 text-left text-sm">
                        <li>Selection of books and essay</li>
                        <li>Looking for the impact on the environment, and the communities on site</li>

                        <button
                          className="px-3 py-1 border border-green-300 text-green-300 hover:bg-green-800 hover:border-green-200 hover:text-green-100 rounded transition-all duration-200 focus:outline-none"
                          onClick={() => {/* handle click */ }}
                        >
                          Load more geographical context
                        </button>

                      </ul>
                    </div>

                    <div className="bg-white-800 p-3">
                      <h4 className="text-md font-semibold text-black-400 text-left">YOU (A User Observer)</h4>
                      <ul className="list-disc ml-4 mt-1 space-y-1 text-left text-sm">
                        <li>Teach the system how to observe the archive</li>

                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="w-1/2 space-y-4">
                  {/* Dialogue Structure */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-left">Dialogue Structure</h3>
                    <div className="bg-gray-800/50 p-3">
                      <ol className="list-decimal ml-4 space-y-2 text-left text-sm">
                        <li className="text-gray-300">
                          <span className="font-semibold">Initial Observation</span>
                          <ul className="list-disc ml-4 mt-1">
                            <li>First impressions from each perspective</li>
                            <li>Multiple aspects analysis</li>
                          </ul>
                        </li>
                        <li className="text-gray-300">
                          <span className="font-semibold">Cross Analysis</span>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Connecting different viewpoints</li>
                            <li>Finding convergence points</li>
                          </ul>
                        </li>
                        <li className="text-gray-300">
                          <span className="font-semibold">Synthesis</span>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Combined perspectives</li>
                            <li>Pattern documentation</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Training Elements */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-left">Training Elements</h3>
                    <div className="bg-gray-800/50 p-3 space-y-2">
                      <div className="text-left text-sm">
                        <h4 className="font-semibold">Observational Skills</h4>
                        <ul className="list-disc ml-4 mt-1 text-gray-300">
                          <li>Multiple perspective analysis</li>
                          <li>Context relationships</li>
                          <li>Systematic methods</li>
                        </ul>
                      </div>
                      <div className="text-left text-sm">
                        <h4 className="font-semibold">Critical Questions</h4>
                        <ul className="list-disc ml-4 mt-1 text-gray-300">
                          <li>Deep connection inquiries</li>
                          <li>Systematic frameworks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button centered at bottom */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleStart}
                  className="px-8 py-4 bg-blue-900 text-white text-xl hover:bg-blue-800 transition-colors font-courier"
                >
                  Begin Dialogue
                </button>
              </div>
            </div>
          ) : isProcessing ? (
            <ProcessingAnimation />
          ) : (
            <div className="max-w-2xl">
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
          )}
        </div>
      </div>

      {/* Right side - Image */}
{/* Right side - Image */}
{/* Right side - Image */}
{/* Right side - Image */}
<div className="w-1/2 bg-black relative">
  <div className="absolute inset-0 flex items-center justify-center">
    {/* Base image - only show faded version after transition */}
    {hasTransitioned && (
      <img
        src="/dorn-manifesto.jpg"
        alt="Base image"
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: 0.3 }}
      />
    )}
    {/* Current/transitioning image */}
    <img
      src={currentImage}
      alt="Current image"
      className="absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out"
      style={{ 
        opacity: hasStarted ? 1 : 0
      }}
      onLoad={() => setImageLoaded(true)}
    />
  </div>
  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
  
  {/* Typing Indicator */}
  {isUserTyping && <TypingIndicator />}
</div>
    </div>
  );
}

export default ChatInterface;
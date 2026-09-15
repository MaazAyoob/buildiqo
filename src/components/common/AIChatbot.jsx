import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle, 
  Calculator, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useEstimateStore, formatCurrency, formatNumber } from '../../store/useEstimateStore';

export function AIChatbot({ onNavigateRoute }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { state, estimation, currentUser } = useEstimateStore();

  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'bot',
      text: "Hello! 👋 I am your Buildiqo AI Construction & Cost Engineer.\n\nI can answer questions about your current project, IS 456 quantities (steel rebar, cement, sand), live material pricing, construction stages, or tips to optimize your budget. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "What is the cost breakdown of my project?",
        "How much steel and cement do I need?",
        "How can I reduce construction cost?",
        "Explain the 6 construction milestone stages",
        "What are the NBC 2016 ground coverage rules?"
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Intelligent context-aware AI response engine
  const generateAIResponse = (userQuery) => {
    const q = userQuery.toLowerCase();
    const city = estimation.city?.name || 'Bengaluru';
    const totalCost = formatCurrency(estimation.grandTotalCost);
    const ratePerSqFt = formatCurrency(estimation.costPerSqFt);
    const bua = formatNumber(estimation.totalBuiltupArea);
    const carpet = formatNumber(estimation.totalCarpetArea);
    const plotSize = `${state.plotWidth}ft × ${state.plotLength}ft (${formatNumber(estimation.plotArea)} sq.ft)`;
    const floors = state.numFloors;
    const tier = (state.tier || 'standard').toUpperCase();

    // 1. Cost & Budget Breakdown query
    if (q.includes('cost') || q.includes('budget') || q.includes('breakdown') || q.includes('price') || q.includes('how much will it cost')) {
      return {
        text: `Here is the real-time cost breakdown for your ${bua} sq.ft (${floors} Floors, ${tier} Quality) residence in ${city}:\n\n` +
          `• Total Estimated Cost: ${totalCost} (Average ${ratePerSqFt}/sq.ft)\n` +
          `• Direct Materials: ${formatCurrency(estimation.directMaterialCost)} (~58%)\n` +
          `• Trade Labor & Shuttering: ${formatCurrency(estimation.totalLaborCost)} (~24%)\n` +
          `• Site Amenities (Sump, Wall): ${formatCurrency(estimation.ancillaryCost)} (~8%)\n` +
          `• Architectural & Contingency: ${formatCurrency(estimation.architectureFee + estimation.contractorMargin + estimation.contingencyBuffer)} (~10%)\n\n` +
          `*Note: Rates are calculated using deterministic IS 456 engineering models indexed to current market rates.*`,
        suggestions: [
          "How much steel and cement do I need?",
          "Show me the milestone payment schedule",
          "How do I reduce costs?"
        ]
      };
    }

    // 2. Steel, Cement & Material quantities (IS 456)
    if (q.includes('steel') || q.includes('cement') || q.includes('sand') || q.includes('material') || q.includes('quantity') || q.includes('aggregate')) {
      const steelTonne = (estimation.totalBuiltupArea * 3.85 * 1.05 / 1000).toFixed(1);
      const cementBags = Math.round(estimation.totalBuiltupArea * 0.42);
      const sandCft = Math.round(estimation.totalBuiltupArea * 1.9);
      const aggregateCft = Math.round(estimation.totalBuiltupArea * 1.35);

      return {
        text: `Based on IS 456 (Concrete) and IS 1786 (High-Yield Deformed Steel) structural standards for your ${bua} sq.ft built-up area:\n\n` +
          `1. Steel TMT Rebar (Fe 550D): ${steelTonne} Tonnes (~3.85 kg/sq.ft + 5% cutting margin)\n` +
          `2. Cement (PPC / Grade 53 OPC): ${cementBags} Bags (50kg each) (~0.42 bags/sq.ft)\n` +
          `3. Manufactured Sand (M-Sand + P-Sand): ${sandCft} Cu.Ft (Zone II graded)\n` +
          `4. 20mm Blue Metal Aggregates: ${aggregateCft} Cu.Ft\n` +
          `5. Masonry AAC Blocks/Bricks: ${Math.round(estimation.totalBuiltupArea * 0.85)} sq.ft wall area\n\n` +
          `You can customize specific material brands (JSW vs Tata Tiscon, UltraTech vs ACC) in Step 3.`,
        suggestions: [
          "Compare Essential vs Luxury package",
          "What is the cost breakdown?",
          "How to reduce construction cost?"
        ]
      };
    }

    // 3. Milestone & Payment stages
    if (q.includes('milestone') || q.includes('stage') || q.includes('payment') || q.includes('schedule') || q.includes('cashflow') || q.includes('time')) {
      return {
        text: `Standard 6-stage construction cashflow disbursement schedule for your project (${totalCost}):\n\n` +
          `• Stage 1 (Foundation & Footings): 15% (${formatCurrency(estimation.grandTotalCost * 0.15)}) • Weeks 1–4\n` +
          `• Stage 2 (Plinth Beam & Sump): 10% (${formatCurrency(estimation.grandTotalCost * 0.10)}) • Weeks 5–7\n` +
          `• Stage 3 (RCC Columns & Roof Slabs): 25% (${formatCurrency(estimation.grandTotalCost * 0.25)}) • Weeks 8–14\n` +
          `• Stage 4 (Brickwork & Lintels): 15% (${formatCurrency(estimation.grandTotalCost * 0.15)}) • Weeks 15–19\n` +
          `• Stage 5 (Plastering & Concealed MEP): 15% (${formatCurrency(estimation.grandTotalCost * 0.15)}) • Weeks 20–24\n` +
          `• Stage 6 (Flooring, Paint & Handover): 20% (${formatCurrency(estimation.grandTotalCost * 0.20)}) • Weeks 25–30\n\n` +
          `*Tip: Never disburse payments ahead of verified milestone completion!*`,
        suggestions: [
          "How to reduce construction cost?",
          "What is included in Plastering stage?",
          "What is the total estimated cost?"
        ]
      };
    }

    // 4. Cost reduction tips
    if (q.includes('reduce') || q.includes('save') || q.includes('optimize') || q.includes('cheap') || q.includes('discount') || q.includes('budget control')) {
      return {
        text: `Top 5 practical ways to reduce your residential construction cost by 10–18% without compromising structural safety:\n\n` +
          `1. Use AAC Blocks over Red Clay Bricks: Saves ~15% on masonry mortar and reduces foundation dead load.\n` +
          `2. Opt for Double-Charged Vitrified Tiles (4x2): Gives a luxurious finish at ₹85–₹120/sq.ft vs Italian marble at ₹350+/sq.ft.\n` +
          `3. Standardize Structural Column Grid: Minimizes non-standard beam cantilevers and reduces rebar cutting waste below 3%.\n` +
          `4. Procure Primary Steel & Cement in Bulk: Coordinate with local authorized distributors for commercial discounts.\n` +
          `5. Finalize BOQ Scope Before Breaking Ground: Avoid mid-construction layout modifications which typically add 12–20% in extra costs.`,
        suggestions: [
          "How much steel and cement do I need?",
          "What is the cost breakdown?",
          "Show me the 3D top view"
        ]
      };
    }

    // 5. Plot, Setbacks & NBC 2016 regulations
    if (q.includes('plot') || q.includes('setback') || q.includes('nbc') || q.includes('coverage') || q.includes('far') || q.includes('bylaw') || q.includes('permission')) {
      return {
        text: `For your plot of ${plotSize} in ${city}:\n\n` +
          `• Plot Area: ${formatNumber(estimation.plotArea)} sq.ft\n` +
          `• Permissible Ground Coverage: Max 70%–75% (${formatNumber(Math.round(estimation.plotArea * 0.75))} sq.ft ground footprint)\n` +
          `• Recommended Front Setback: Minimum 5–8 ft depending on road width (${state.roadWidth} ft)\n` +
          `• Side & Rear Setbacks: Minimum 3–5 ft for ventilation, rainwater lines, and light.\n` +
          `• Target Built-up Area: ${bua} sq.ft across ${floors} floor(s).`,
        suggestions: [
          "How to configure rooms in Step 2?",
          "What is the cost breakdown?",
          "Explain 3D top view"
        ]
      };
    }

    // 6. 3D Top View / 3D model
    if (q.includes('3d') || q.includes('top view') || q.includes('model') || q.includes('plan') || q.includes('view')) {
      return {
        text: `You can view your building in both 3D Perspective Orbit and Top Orthographic Plan View:\n\n` +
          `• Top View (Plan): Switches camera straight above to inspect the room layout, walls, and setbacks.\n` +
          `• 360° 3D Orbit: Drag to orbit around your house in 3D from any elevation.\n` +
          `• Play Timelapse: Progressively animates through all 6 construction phases from excavation to completion!`,
        suggestions: [
          "What are the 6 construction stages?",
          "What is the total estimated cost?",
          "How much steel and cement do I need?"
        ]
      };
    }

    // Default intelligent conversational fallback
    return {
      text: `For your ${bua} sq.ft residence in ${city} (Estimated total: ${totalCost}):\n\n` +
        `Buildiqo.ai calculates quantities using deterministic IS 456 standards. You can ask me anything about:\n` +
        `• Steel, Cement & M-Sand quantities required\n` +
        `• Detailed BOQ breakdown & labor charges\n` +
        `• 6-Stage payment disbursement schedule\n` +
        `• Ways to save on material & finish costs\n` +
        `• NBC 2016 setbacks & ground coverage`,
      suggestions: [
        "What is the cost breakdown?",
        "How much steel and cement do I need?",
        "Explain the 6 construction milestone stages",
        "How to reduce construction cost?"
      ]
    };
  };

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(text);
      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: `Chat reset. I am ready to answer any questions about your ${formatNumber(estimation.totalBuiltupArea)} sq.ft project in ${estimation.city?.name}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          "What is the cost breakdown of my project?",
          "How much steel and cement do I need?",
          "How can I reduce construction cost?",
          "Explain the 6 construction milestone stages"
        ]
      }
    ]);
  };

  return (
    <>
      {/* Floating Chat Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <div className="fixed bottom-24 sm:bottom-28 right-6 z-50 animate-bounce-subtle no-print">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center space-x-2.5 px-4 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl hover:shadow-blue-500/40 transition-all transform hover:scale-105 border-2 border-white"
          >
            <div className="relative">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-blue-600 animate-pulse" />
            </div>
            <span className="font-extrabold text-xs tracking-tight">AI Construction Assistant</span>
            <Sparkles className="w-4 h-4 text-blue-200 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-white rounded-3xl border border-blue-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 no-print ${
            isExpanded 
              ? 'bottom-4 right-4 left-4 top-20 sm:left-auto sm:top-auto sm:w-[620px] sm:h-[680px]' 
              : 'bottom-6 right-6 w-[92vw] sm:w-[410px] h-[540px]'
          }`}
        >
          {/* Chat Window Header */}
          <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-sm tracking-tight text-white">Buildiqo AI Assistant</h3>
                  <span className="px-1.5 py-0.2 rounded-md bg-green-400/30 text-green-200 text-[9px] font-extrabold uppercase border border-green-400/40">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-blue-100 font-medium">
                  {estimation.city?.name} • {formatNumber(estimation.totalBuiltupArea)} sq.ft • {formatCurrency(estimation.grandTotalCost)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
                title={isExpanded ? "Collapse Window" : "Expand Window"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 text-xs">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end space-x-2 max-w-[88%]">
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div 
                    className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs font-semibold shadow-xs'
                        : 'bg-white text-slate-900 rounded-bl-xs border border-slate-200 shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 px-8">
                  {msg.timestamp}
                </span>

                {/* Interactive Suggestion Chips for Bot responses */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 pl-8 max-w-[95%]">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold transition-colors text-left flex items-center space-x-1"
                      >
                        <span>{suggestion}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-blue-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl flex items-center space-x-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about steel, cement, costs, stages..."
              className="flex-1 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors shrink-0 shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}


import { useRef } from "react";
import { format } from "date-fns";
import { MessageSquare, RefreshCw, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Message, User } from "@/types";

interface TicketMessagesProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isSending: boolean;
  showKeyboardHint: boolean;
  setShowKeyboardHint: (show: boolean) => void;
  getUserById: (id: string) => User | undefined;
  currentUser: User;
  creator?: User;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function TicketMessages({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  isLoading,
  isSending,
  showKeyboardHint,
  setShowKeyboardHint,
  getUserById,
  currentUser,
  creator,
  messagesEndRef,
  textareaRef
}: TicketMessagesProps) {
  return (
    <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center">
        <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        <h3 className="font-medium">сообщения</h3>
        {messages.length > 0 && (
          <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-1.5 rounded-full">
            {messages.length}
          </span>
        )}
      </div>
      
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">пока нет сообщений в этом тикете</p>
            <p className="text-xs text-muted-foreground/70 mt-1">отправьте первое сообщение ниже</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const messageUser = getUserById(message.userId);
              if (!messageUser) return null;
              
              const isCreator = messageUser.id === creator?.id;
              const isCurrentUser = messageUser.id === currentUser.id;
              const messageTime = format(new Date(message.createdAt), "dd.MM HH:mm");
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 pt-1">
                      <UserAvatar user={messageUser} />
                    </div>
                    <div>
                      <div className={`mb-1 flex items-center gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                        <div className="font-medium text-sm">
                          {messageUser.role === 'admin' && (
                            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded mr-1">
                              Менеджер
                            </span>
                          )}
                          {messageUser.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {messageTime}
                        </div>
                      </div>
                      <div 
                        className={`p-3 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Reply form with improved keyboard hint */}
      <div className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="relative">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.length > 0) {
                setShowKeyboardHint(false);
              } else {
                setShowKeyboardHint(true);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowKeyboardHint(true)}
            onBlur={() => setShowKeyboardHint(false)}
            placeholder="введите Ваше сообщение..."
            className="mb-2 resize-none min-h-[100px]"
            rows={3}
          />
          
          {/* Keyboard hint styling */}
          {showKeyboardHint && (
            <div className="absolute bottom-[60px] right-0 bg-background border shadow-sm rounded-md py-1 px-2 text-xs text-muted-foreground flex items-center gap-1 mr-3">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium">Shift</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium">Enter</kbd>
              <span className="mx-1">для новой строки</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-medium ml-1">Enter</kbd>
              <span className="mx-1">для отправки</span>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isLoading || isSending || !newMessage.trim()}
              className="gap-2"
            >
              {isLoading || isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  отправка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  отправить
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
import { theme } from '../theme';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/chat');
        const formattedHistory = response.data.map((msg) => ({
          id: msg._id,
          text: msg.text,
          isUser: msg.isUser,
        }));
        setMessages(formattedHistory);
      } catch (error) {
        console.log('Failed to load chat history');
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now().toString() + '-user', text: inputText.trim(), isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    const promptToSend = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.post('/chat', { message: promptToSend });
      const aiMsg = { id: Date.now().toString() + '-ai', text: response.data.reply, isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + '-err', text: 'Connection error with AI trainer.', isUser: false },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="fitness" size={24} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>AI Pocket Trainer</Text>
        </View>

        {loadingHistory ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              ref={flatListRef}
              data={
                messages.length === 0
                  ? [{ id: 'intro', text: 'Hello! I am your AI Trainer. How can I help you today?', isUser: false }]
                  : messages
              }
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
          </TouchableWithoutFeedback>
        )}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={styles.typingText}>Trainer is typing...</Text>
          </View>
        )}

        {/* Input Bar pinned right above the keyboard */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask for workout advice..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isTyping}>
            <Ionicons name="send" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.shadow,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  chatList: { padding: 20, paddingBottom: 10, flexGrow: 1 },
  messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 20, marginBottom: 15 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.accent, borderBottomRightRadius: 5 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: theme.card, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: theme.background, fontWeight: '600' },
  aiText: { color: theme.textPrimary },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: theme.card,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.background,
    color: theme.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 25,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  typingText: { color: theme.textSecondary, marginLeft: 8, fontStyle: 'italic' },
});
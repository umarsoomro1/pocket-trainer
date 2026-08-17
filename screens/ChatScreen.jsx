import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
import { theme } from '../theme';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/chat');
        // Map DB schema to frontend state
        const formattedHistory = response.data.map(msg => ({
          id: msg._id,
          text: msg.text,
          isUser: msg.isUser
        }));
        setMessages(formattedHistory);
      } catch (error) {
        console.log("Failed to load chat history");
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // FIX: Unique ID for the user message
    const userMsg = { id: Date.now().toString() + '-user', text: inputText, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.post('/chat', { message: userMsg.text });
      // FIX: Unique ID for the AI message
      const aiMsg = { id: Date.now().toString() + '-ai', text: response.data.reply, isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      // FIX: Unique ID for the error message instead of the static 'err'
      setMessages((prev) => [...prev, { id: Date.now().toString() + '-err', text: "Connection error.", isUser: false }]);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Pocket Trainer</Text>
      </View>

      {loadingHistory ? (
        <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator color={theme.accent} /></View>
      ) : (
        <FlatList
          data={messages.length === 0 ? [{ id: 'intro', text: 'Hello! I am your AI Trainer. How can I help today?', isUser: false }] : messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.accent} />
          <Text style={styles.typingText}>Trainer is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Ask for advice..." placeholderTextColor={theme.textSecondary} value={inputText} onChangeText={setInputText} multiline />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={20} color={theme.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: theme.card, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.shadow },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.accent },
  chatList: { padding: 20, paddingBottom: 10 },
  messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 20, marginBottom: 15 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.accent, borderBottomRightRadius: 5 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: theme.card, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: theme.background, fontWeight: '500' },
  aiText: { color: theme.textPrimary },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: theme.card, alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.background, color: theme.textPrimary, padding: 12, borderRadius: 20, fontSize: 16, maxHeight: 100 },
  sendButton: { backgroundColor: theme.accent, padding: 12, borderRadius: 25, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  typingText: { color: theme.textSecondary, marginLeft: 8, fontStyle: 'italic' }
});
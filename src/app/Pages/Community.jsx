import React, { useState, useEffect, useRef, useContext } from "react";
import { collection, query, orderBy, limit, startAfter, onSnapshot, addDoc, doc, getDocs, where , getDoc} from "firebase/firestore";
import { db, auth } from "../../config";
import { AuthContext } from "../../authContext";

const Community = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "chatMessages"), orderBy("timestamp", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        repliesLoaded: false,
        replies: []
      }));
      setMessages(messageList);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const loadMoreMessages = () => {
    if (!lastVisible || loading) return;
    setLoading(true);
    const q = query(collection(db, "chatMessages"), orderBy("timestamp", "desc"), startAfter(lastVisible), limit(10));
    onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        repliesLoaded: false,
        replies: []
      }));
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    });
  };

  const getUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      return userDoc.exists() ? userDoc.data().role : "unknown";
    } catch (error) {
      console.error("Error fetching role:", error);
      return "unknown";
    }
  };

  const fetchReplies = async (parentId) => {
    const q = query(collection(db, "chatMessages"), where("parentId", "==", parentId), orderBy("timestamp", "desc"), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const { uid, displayName } = auth.currentUser;
    const role = await getUserRole(uid);

    const messageData = {
      userId: uid,
      username: displayName || "Anonymous",
      role,
      content: newMessage,
      timestamp: new Date(),
      parentId: replyTo ? replyTo.id : null
    };

    try {
      await addDoc(collection(db, "chatMessages"), messageData);
      setNewMessage("");
      setReplyTo(null);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReply = async (message) => {
    if (!message.repliesLoaded) {
      const replies = await fetchReplies(message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, replies, repliesLoaded: true } : m));
    }
    setReplyTo(message);
  };

  const styles = {
    chatContainer: "p-4 bg-gray-900 text-white min-h-screen",
    chatFeed: "space-y-4",
    message: "p-2 bg-gray-800 rounded shadow",
    reply: "p-2 ml-4 bg-gray-700 rounded",
    chatInput: "flex space-x-2 p-4 bg-gray-800 fixed bottom-0 w-full",
    input: "flex-1 p-2 rounded bg-gray-700 text-white",
    button: "p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatFeed}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.message}>
            <strong>{msg.username} ({msg.role}):</strong> {msg.content}
            <button onClick={() => handleReply(msg)} className={styles.button}>Reply</button>
            {msg.replies.length > 0 && (
              <div className="replies">
                {msg.replies.map((reply) => (
                  <div key={reply.id} className={styles.reply}>
                    <strong>{reply.username} ({reply.role}):</strong> {reply.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div>Loading...</div>}
        {!loading && lastVisible && (
          <button onClick={loadMoreMessages} className={styles.button}>Load More</button>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className={styles.chatInput}>
        {replyTo && <div>Replying to: {replyTo.content} <button onClick={() => setReplyTo(null)} className={styles.button}>Cancel</button></div>}
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={replyTo ? "Type your reply..." : "Type your message..."}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>{replyTo ? "Send Reply" : "Send"}</button>
      </form>
    </div>
  );
};

export default Community;
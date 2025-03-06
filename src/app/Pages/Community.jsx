import React, { useState, useEffect, useRef, useContext } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  doc,
  getDocs,
  where,
  getDoc,
} from "firebase/firestore";
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

  // Fetch initial messages
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "chatMessages"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const messageList = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const userData = await getUserData(data.userId);
            return {
              id: doc.id,
              ...data,
              username: userData.username || "Anonymous",
              profilePhoto: userData.profilePhoto || null,
              role: userData.role || "unknown",
              repliesLoaded: false,
              replies: [],
            };
          })
        );
        setMessages(messageList);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Function to fetch user data from "users" collection
  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      return userDoc.exists()
        ? userDoc.data()
        : { username: "Anonymous", profilePhoto: null, role: "unknown" };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return { username: "Anonymous", profilePhoto: null, role: "unknown" };
    }
  };

  const loadMoreMessages = async () => {
    if (!lastVisible || loading) return;
    setLoading(true);
    const q = query(
      collection(db, "chatMessages"),
      orderBy("timestamp", "desc"),
      startAfter(lastVisible),
      limit(10)
    );
    onSnapshot(q, async (snapshot) => {
      const newMessages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const userData = await getUserData(data.userId);
          return {
            id: doc.id,
            ...data,
            username: userData.username || "Anonymous",
            profilePhoto: userData.profilePhoto || null,
            role: userData.role || "unknown",
            repliesLoaded: false,
            replies: [],
          };
        })
      );
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    });
  };

  const fetchReplies = async (parentId) => {
    const q = query(
      collection(db, "chatMessages"),
      where("parentId", "==", parentId),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const snapshot = await getDocs(q);
    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userData = await getUserData(data.userId);
        return {
          id: doc.id,
          ...data,
          username: userData.username || "Anonymous",
          profilePhoto: userData.profilePhoto || null,
          role: userData.role || "unknown",
        };
      })
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const { uid } = auth.currentUser;
    const userData = await getUserData(uid);

    const messageData = {
      userId: uid,
      username: userData.username || "Anonymous",
      profilePhoto: userData.profilePhoto || null,
      role: userData.role || "unknown",
      content: newMessage,
      timestamp: new Date(),
      parentId: replyTo ? replyTo.id : null,
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
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, replies, repliesLoaded: true } : m
        )
      );
    }
    setReplyTo(message);
  };

  // Enhanced styles for a polished UI
  const styles = {
    container: "flex h-screen bg-gray-900 text-white",
    sidebar: "w-64 p-4 space-y-4 bg-gray-800",
    sidebarItem: "flex items-center space-x-2 hover:bg-gray-700 p-2 rounded",
    mainContent: "flex-1 p-4 overflow-y-auto",
    post: "p-4 border-b border-gray-700 flex space-x-3",
    avatar: "w-10 h-10 rounded-full bg-gray-600",
    postHeader: "flex justify-between items-start",
    username: "font-bold text-blue-400",
    role: "text-gray-500 text-sm",
    content: "text-gray-200 mt-1",
    interaction: "flex space-x-4 text-gray-400 mt-2 text-sm",
    replyButton: "bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600",
    loadMore:
      "w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600",
    inputArea:
      "fixed bottom-0 w-[calc(100%-256px)] p-4 bg-gray-800 flex space-x-2 items-center",
    input: "flex-1 p-2 bg-gray-700 text-white rounded focus:outline-none",
    postButton: "bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600",
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="home">
            🏠
          </span>{" "}
          Home
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="explore">
            🔍
          </span>{" "}
          Explore
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="notifications">
            🔔
          </span>{" "}
          Notifications
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="messages">
            💬
          </span>{" "}
          Messages
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="grok">
            🤖
          </span>{" "}
          Grok
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="premium">
            ⭐
          </span>{" "}
          Premium
        </div>
        <div className={styles.sidebarItem}>
          <span role="img" aria-label="communities">
            👥
          </span>{" "}
          Communities
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.post}>
            <div className={styles.avatar} />
            <div className="flex-1">
              <div className={styles.postHeader}>
                <div>
                  <span className={styles.username}>{msg.username}</span>
                  <span className={styles.role}> ({msg.role})</span>
                </div>
              </div>
              <div className={styles.content}>{msg.content}</div>
              <div className={styles.interaction}>
                <span>💬 {Math.floor(Math.random() * 100)}</span>
                <span>❤️ {Math.floor(Math.random() * 1000)}k</span>
                <span>🔄 {Math.floor(Math.random() * 10)}k</span>
              </div>
              <button
                onClick={() => handleReply(msg)}
                className={styles.replyButton}
              >
                Reply
              </button>
            </div>
          </div>
        ))}
        {loading && <div className="text-center text-gray-400">Loading...</div>}
        {!loading && lastVisible && (
          <button onClick={loadMoreMessages} className={styles.loadMore}>
            Load More
          </button>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className={styles.inputArea}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={
            replyTo
              ? `Replying to ${replyTo.username}: ${replyTo.content}`
              : "What's happening?"
          }
          className={styles.input}
        />
        <button type="submit" className={styles.postButton}>
          {replyTo ? "Reply" : "Post"}
        </button>
      </form>
    </div>
  );
};

export default Community;

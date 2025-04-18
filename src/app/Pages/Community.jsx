import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../authContext";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import Sidebar from "../Components/Sidebar";

const db = getFirestore();
const storage = getStorage();
const auth = getAuth();

const Community = () => {
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [newCommentContent, setNewCommentContent] = useState({});
  const [newCommentImage, setNewCommentImage] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [expandedComments, setExpandedComments] = useState({}); // New state for comment visibility
  const navigate = useNavigate();

  // Fetch user name from Firestore users collection
  const getUserName = async (uid) => {
    try {
      console.log("Fetching name for UID:", uid);
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const name = data.name || "Anonymous";
        console.log("User document found:", { uid, name, email: data.email });
        return name;
      }
      console.log("No user document found for UID:", uid);
      return "Anonymous";
    } catch (err) {
      console.error("Error fetching user name for UID:", uid, err);
      return "Anonymous";
    }
  };

  // Fetch posts and comments with real-time updates
  useEffect(() => {
    if (!authLoading) {
      setLoading(true);
      setError(null);

      console.log(
        "Current user:",
        user ? { uid: user.uid, email: user.email } : "No user"
      );

      const now = new Date();
      const postsQuery = query(
        collection(db, "posts"),
        where("expires_at", ">", now),
        orderBy("expires_at", "desc")
      );

      const unsubscribePosts = onSnapshot(
        postsQuery,
        async (postsSnapshot) => {
          try {
            const postsData = [];
            for (const postDoc of postsSnapshot.docs) {
              const post = { id: postDoc.id, ...postDoc.data(), comments: [] };
              console.log("Post data:", {
                id: post.id,
                user_id: post.user_id,
                user_name: post.user_name,
                content: post.content,
              });

              const commentsQuery = query(
                collection(db, "comments"),
                where("post_id", "==", post.id),
                where("expires_at", ">", now),
                orderBy("created_at", "asc")
              );
              const commentsSnapshot = await getDocs(commentsQuery);
              post.comments = commentsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              postsData.push(post);
            }

            setPosts(postsData);
            setLoading(false);
          } catch (err) {
            console.error("Error fetching posts or comments:", err);
            if (err.message.includes("index")) {
              setError(
                "A Firestore index is required for this query. Please create it in the Firebase Console and try again."
              );
            } else {
              setError("Failed to fetch posts. Please try again.");
            }
            setLoading(false);
          }
        },
        (err) => {
          console.error("Error listening to posts:", err);
          if (err.message.includes("index")) {
            setError(
              "A Firestore index is required for this query. Please create it in the Firebase Console and try again."
            );
          } else {
            setError("Failed to fetch posts. Please try again.");
          }
          setLoading(false);
        }
      );

      const commentsQuery = query(
        collection(db, "comments"),
        where("expires_at", ">", now)
      );
      const unsubscribeComments = onSnapshot(
        commentsQuery,
        async () => {
          try {
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = [];
            for (const postDoc of postsSnapshot.docs) {
              const post = { id: postDoc.id, ...postDoc.data(), comments: [] };
              const commentsQuery = query(
                collection(db, "comments"),
                where("post_id", "==", post.id),
                where("expires_at", ">", now),
                orderBy("created_at", "asc")
              );
              const commentsSnapshot = await getDocs(commentsQuery);
              post.comments = commentsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              postsData.push(post);
            }
            setPosts(postsData);
          } catch (err) {
            console.error("Error refreshing posts on comment change:", err);
            if (err.message.includes("index")) {
              setError(
                "A Firestore index is required for this query. Please create it in the Firebase Console and try again."
              );
            } else {
              setError("Failed to refresh posts. Please try again.");
            }
          }
        },
        (err) => {
          console.error("Error listening to comments:", err);
          if (err.message.includes("index")) {
            setError(
              "A Firestore index is required for this query. Please create it in the Firebase Console and try again."
            );
          } else {
            setError("Failed to fetch comments. Please try again.");
          }
        }
      );

      return () => {
        unsubscribePosts();
        unsubscribeComments();
      };
    }
  }, [authLoading]);

  // Handle image upload to Firebase Storage
  const uploadImage = async (file, type, id) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `community-images/${type}/${id}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      return imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again.");
      return null;
    }
  };

  // Create a new post
  const handleCreatePost = async () => {
    if (!user || (!newPostContent && !newPostImage)) return;
    setLoading(true);
    setError(null);
    const postId = uuidv4();
    let imageUrl = null;

    try {
      if (newPostImage) {
        imageUrl = await uploadImage(newPostImage, "posts", postId);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
      const userName = await getUserName(user.uid);

      await addDoc(collection(db, "posts"), {
        id: postId,
        user_id: user.uid,
        user_name: userName,
        content: newPostContent,
        image_url: imageUrl,
        created_at: createdAt,
        expires_at: expiresAt,
      });

      console.log("Post created:", {
        id: postId,
        user_id: user.uid,
        user_name: userName,
      });

      setNewPostContent("");
      setNewPostImage(null);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    }
    setLoading(false);
  };

  // Create a new comment
  const handleCreateComment = async (postId) => {
    if (!user || (!newCommentContent[postId] && !newCommentImage[postId]))
      return;
    setLoading(true);
    setError(null);
    const commentId = uuidv4();
    let imageUrl = null;

    try {
      if (newCommentImage[postId]) {
        imageUrl = await uploadImage(
          newCommentImage[postId],
          "comments",
          commentId
        );
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours later
      const userName = await getUserName(user.uid);

      await addDoc(collection(db, "comments"), {
        id: commentId,
        post_id: postId,
        user_id: user.uid,
        user_name: userName,
        content: newCommentContent[postId] || "",
        image_url: imageUrl,
        created_at: createdAt,
        expires_at: expiresAt,
      });

      console.log("Comment created:", {
        id: commentId,
        user_id: user.uid,
        user_name: userName,
      });

      setNewCommentContent({ ...newCommentContent, [postId]: "" });
      setNewCommentImage({ ...newCommentImage, [postId]: null });
      setExpandedComments((prev) => ({ ...prev, [postId]: true })); // Keep comments visible after posting
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to create comment. Please try again.");
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to log out. Please try again.");
    }
  };

  // Validate timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown time";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "Unknown time";
    const now = new Date();
    const diff = now - date;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`; // Minutes
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; // Hours
    return date.toLocaleDateString();
  };

  // Toggle expanded content
  const toggleExpanded = (postId) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Handle loading and authentication errors
  if (authLoading)
    return (
      <div className="text-center text-gray-400">Loading authentication...</div>
    );
  if (authError || !user)
    return (
      <div className="text-center text-red-400">
        Please log in to access the community.
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-800">
      {/* Fixed Sidebar */}
      <div className="fixed w-64 bg-blue-800 text-white h-screen overflow-y-auto border-0 outline-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 ml-64 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Community
        </h1>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-gray-400 text-center mb-4">Loading...</div>
        )}

        {/* Create Post */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <textarea
            className="w-full p-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={2}
          />
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPostImage(e.target.files[0])}
                className="hidden"
              />
              Image
            </label>
            <button
              onClick={handleCreatePost}
              className="bg-blue-600 text-white px-4 py-1 rounded-full hover:bg-blue-700 transition disabled:bg-gray-600"
              disabled={loading}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
          {newPostImage && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(newPostImage)}
                alt="Preview"
                className="w-full rounded-lg"
              />
              <span className="text-sm text-gray-400">{newPostImage.name}</span>
            </div>
          )}
        </div>

        {/* Posts List */}
        {posts.map((post) => {
          const isLongContent = post.content.length > 280;
          const displayContent = expandedPosts[post.id]
            ? post.content
            : post.content.slice(0, 280);

          return (
            <div key={post.id} className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {post.user_name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {post.user_name || "Anonymous"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatTimestamp(post.created_at)}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-white mt-2 whitespace-pre-wrap">
                    {displayContent.replace(
                      /#(\w+)/g,
                      '<span class="text-orange-500">#$1</span>'
                    )}
                    {isLongContent && !expandedPosts[post.id] && (
                      <button
                        onClick={() => toggleExpanded(post.id)}
                        className="text-blue-400 hover:text-blue-300 ml-2"
                      >
                        Show more
                      </button>
                    )}
                  </p>
                  {post.image_url && (
                    <div className="mt-3">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                  <div
                    className="flex items-center mt-3 text-gray-400 cursor-pointer"
                    onClick={() => toggleComments(post.id)}
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
              {/* Comment Section (Hidden by Default) */}
              {expandedComments[post.id] && (
                <div className="mt-4 border-t border-gray-600 pt-3">
                  <h3 className="text-white font-semibold mb-2">Comments</h3>
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-600 rounded-lg p-3 mb-2"
                    >
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">
                          {comment.user_name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div className="ml-2 flex-1">
                          <p className="font-medium text-white">
                            {comment.user_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(comment.created_at)}
                          </p>
                          <p className="text-white mt-1">{comment.content}</p>
                          {comment.image_url && (
                            <img
                              src={comment.image_url}
                              alt="Comment"
                              className="w-full rounded-lg mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Create Comment */}
                  <div className="mt-3">
                    <textarea
                      className="w-full p-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add a comment..."
                      value={newCommentContent[post.id] || ""}
                      onChange={(e) =>
                        setNewCommentContent({
                          ...newCommentContent,
                          [post.id]: e.target.value,
                        })
                      }
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center text-gray-300 hover:text-white cursor-pointer">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setNewCommentImage({
                              ...newCommentImage,
                              [post.id]: e.target.files[0],
                            })
                          }
                          className="hidden"
                        />
                        Image
                      </label>
                      <button
                        onClick={() => handleCreateComment(post.id)}
                        className="bg-blue-600 text-white px-4 py-1 rounded-full hover:bg-blue-700 transition disabled:bg-gray-600"
                        disabled={loading}
                      >
                        {loading ? "Commenting..." : "Comment"}
                      </button>
                    </div>
                    {newCommentImage[post.id] && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(newCommentImage[post.id])}
                          alt="Preview"
                          className="w-full rounded-lg"
                        />
                        <span className="text-sm text-gray-400">
                          {newCommentImage[post.id].name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Community;

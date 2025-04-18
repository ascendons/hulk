const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

exports.deleteExpiredChats = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // Delete expired posts
    const postsQuery = db.collection("posts").where("expires_at", "<=", now);
    const postsSnapshot = await postsQuery.get();

    const postDeletions = [];
    for (const doc of postsSnapshot.docs) {
      const post = doc.data();
      // Delete associated image if it exists
      if (post.image_url) {
        const filePath = getFilePathFromUrl(post.image_url);
        if (filePath) {
          try {
            await storage.bucket().file(filePath).delete();
          } catch (err) {
            console.error(`Error deleting post image ${filePath}:`, err);
          }
        }
      }
      // Delete the post
      postDeletions.push(doc.ref.delete());
    }

    // Delete expired comments
    const commentsQuery = db
      .collection("comments")
      .where("expires_at", "<=", now);
    const commentsSnapshot = await commentsQuery.get();

    const commentDeletions = [];
    for (const doc of commentsSnapshot.docs) {
      const comment = doc.data();
      // Delete associated image if it exists
      if (comment.image_url) {
        const filePath = getFilePathFromUrl(comment.image_url);
        if (filePath) {
          try {
            await storage.bucket().file(filePath).delete();
          } catch (err) {
            console.error(`Error deleting comment image ${filePath}:`, err);
          }
        }
      }
      // Delete the comment
      commentDeletions.push(doc.ref.delete());
    }

    // Delete expired timetables
    const timetablesQuery = db
      .collection("daytimetable")
      .where("deletionTimestamp", "<=", now);
    const timetablesSnapshot = await timetablesQuery.get();

    const timetableDeletions = [];
    for (const doc of timetablesSnapshot.docs) {
      timetableDeletions.push(doc.ref.delete());
    }

    // Execute all deletions
    await Promise.all([
      ...postDeletions,
      ...commentDeletions,
      ...timetableDeletions,
    ]);
    console.log(
      `Deleted ${postDeletions.length} posts, ${commentDeletions.length} comments, and ${timetableDeletions.length} timetables`
    );
    return null;
  });

function getFilePathFromUrl(url) {
  try {
    const match = url.match(/community-images%2F(posts|comments)%2F[^?]+/);
    if (match) {
      return decodeURIComponent(match[0].replace("%2F", "/"));
    }
    return null;
  } catch (err) {
    console.error("Error parsing storage URL:", err);
    return null;
  }
}

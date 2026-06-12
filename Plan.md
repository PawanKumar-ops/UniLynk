### Future Improvement: Comment Loading

Currently, the thread page loads all comments for a post at once. This can become inefficient for posts with hundreds or thousands of comments, increasing response size, memory usage, and initial load time.

A better approach is to implement **cursor-based infinite comment loading** using `useInfiniteQuery` and `IntersectionObserver`, where only the first batch of comments is loaded initially and additional comments are fetched as the user scrolls. This will significantly improve scalability, reduce network payload, and provide a smoother experience for large discussions.

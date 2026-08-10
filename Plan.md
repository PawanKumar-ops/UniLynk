### Future Improvement: Comment Loading

Currently, the thread page loads all comments for a post at once. This can become inefficient for posts with hundreds or thousands of comments, increasing response size, memory usage, and initial load time.

A better approach is to implement **cursor-based infinite comment loading** using `useInfiniteQuery` and `IntersectionObserver`, where only the first batch of comments is loaded initially and additional comments are fetched as the user scrolls. This will significantly improve scalability, reduce network payload, and provide a smoother experience for large discussions.

error is coming password should contain 1 no. and 1 alphabet after sending otp

user go to onboarding page even if he has an account while sign in

if loged in in deploy by google, it go to localhost page and when tried to go to dashboard without log in it still go to localhost instead of signin page

after sign out go to localhost page

404 error if net slow when clicked on group chat
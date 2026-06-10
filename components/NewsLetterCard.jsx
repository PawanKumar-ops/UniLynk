import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReliableImage from "./ReliableImage";

const fallbackPosts = [
  {
    id: "fallback-1",
    clubName: "Mango Lovers Club",
    clubLogo:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    coverImage:
      "https://marketplace.canva.com/EAFO-opW4Rw/1/0/1131w/canva-beige-and-gold-modern-feminine-business-email-newsletter-hP5DyZaOmfE.jpg",
    price: 270,
    description:
      "Loved worldwide for their sweetness our Alphonso mangoes are a delicious delight wherever you are.",
    tint: "from-neutral-900/60 via-neutral-900/15 to-transparent",
  },
  {
    id: "fallback-2",
    clubName: "Berry Garden Co.",
    clubLogo:
      "https://images.unsplash.com/photo-1518635017498-87f514b751ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    coverImage:
      "https://gillde.com/wp-content/uploads/2022/10/4-Email-Newsletter-Templates-Gillde.jpg",
    price: 320,
    description:
      "Fresh handpicked strawberries from our farms, bursting with juicy flavor in every single bite.",
    tint: "from-neutral-900/60 via-neutral-900/15 to-transparent",
  },
  {
    id: "fallback-3",
    clubName: "Citrus Society",
    clubLogo:
      "https://images.unsplash.com/photo-1557800636-894a64c1696f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    coverImage:
      "https://gillde.com/wp-content/uploads/2022/10/1-Email-Newsletter-Templates-Gillde.jpg",
    price: 180,
    description:
      "Sun-ripened oranges packed with vitamin C, perfect for fresh juice or a healthy afternoon snack.",
    tint: "from-neutral-900/60 via-neutral-900/15 to-transparent",
  },
];

const ImageWithFallback = ({ src, alt, className = "" }) => (
  <ReliableImage
    src={src}
    alt={alt}
    className={className}
    maxRetries={2}
    fallbackSrc="/Profilepic.png"
  />
);

const normalizeNewsletter = (newsletter, index) => {
  if (!newsletter || typeof newsletter !== "object") return null;

  const id = newsletter.id || newsletter._id || `newsletter-${index}`;
  const coverImage = newsletter.coverImage || newsletter.image;

  if (!coverImage) return null;

  return {
    id,
    clubName: newsletter.clubName || newsletter.club || "Club",
    clubLogo: newsletter.clubLogo || newsletter.avatar || "/Defaultclublogo.svg",
    coverImage,
    price: Number(newsletter.price || 0),
    description: newsletter.description || "",
    tint: newsletter.tint || "from-neutral-900/60 via-neutral-900/15 to-transparent",
    expiresAt: newsletter.expiresAt || null,
  };
};

const formatPrice = (price) => {
  const numericPrice = Number(price || 0);
  return numericPrice > 0 ? `₹${numericPrice}` : "Free";
};

export function NewsLetterCard() {
  const [index, setIndex] = useState(0);
  const [newsletters, setNewsletters] = useState([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadNewsletters = useCallback(async ({ resetIndex = true } = {}) => {
    try {
      const response = await fetch("/api/newsletter", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch newsletters");
      }

      setNewsletters(
        Array.isArray(data?.newsletters)
          ? data.newsletters
              .map((newsletter, index) => normalizeNewsletter(newsletter, index))
              .filter(Boolean)
          : []
      );
      if (resetIndex) setIndex(0);
      setNowMs(Date.now());
    } catch (error) {
      console.error("NEWSLETTER FETCH ERROR:", error);
      setNewsletters([]);
    }
  }, []);

  useEffect(() => {
    loadNewsletters();
  }, [loadNewsletters]);

  const liveNewsletters = useMemo(
    () =>
      newsletters.filter((newsletter) => {
        const expiresAtMs = new Date(newsletter.expiresAt || 0).getTime();
        return Number.isFinite(expiresAtMs) && expiresAtMs > nowMs;
      }),
    [newsletters, nowMs]
  );

  useEffect(() => {
    const nextExpiryMs = liveNewsletters.reduce((closest, newsletter) => {
      const expiresAtMs = new Date(newsletter.expiresAt || 0).getTime();
      if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) return closest;
      return Math.min(closest, expiresAtMs);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(nextExpiryMs)) return undefined;

    const timeoutMs = Math.min(Math.max(nextExpiryMs - nowMs + 1000, 1000), 2147483647);
    const timeoutId = window.setTimeout(() => {
      setNowMs(Date.now());
      loadNewsletters({ resetIndex: false });
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [liveNewsletters, loadNewsletters, nowMs]);

  const posts = liveNewsletters.length > 0 ? liveNewsletters : fallbackPosts;

  useEffect(() => {
    setIndex((currentIndex) => (currentIndex >= posts.length ? 0 : currentIndex));
  }, [posts.length]);

  useEffect(() => {
    if (posts.length <= 1) return undefined;

    const timeoutId = window.setTimeout(() => {
      setIndex((i) => (i + 1) % posts.length);
    }, 60000);

    return () => window.clearTimeout(timeoutId);
  }, [index, posts.length]);

  const post = posts[index] || posts[0];

  const go = (dir) =>
    setIndex((i) => (i + dir + posts.length) % posts.length);

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-[#e4eaec] text-white"
      style={{ width: 325, height: 475 }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={post.id || index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={post.coverImage}
            alt={post.clubName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t ${post.tint} to-transparent`}
          />
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => go(-1)}
        aria-label="Previous"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute left-1/2 -translate-x-1/2 top-[52%] flex gap-1.5 z-10">
        {posts.map((item, i) => (
          <span
            key={item.id || i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={post.id || index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/70 bg-white/20 shrink-0">
                  <ImageWithFallback
                    src={post.clubLogo}
                    alt={`${post.clubName} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="truncate"
                  style={{ fontSize: 18, fontWeight: 700 }}
                >
                  {post.clubName}
                </span>
              </div>
              <div className="bg-black/35 backdrop-blur-md rounded-full px-4 py-1.5 shrink-0">
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {formatPrice(post.price)}
                </span>
              </div>
            </div>

            <p className="text-white/90" style={{ fontSize: 14, lineHeight: 1.45 }}>
              {post.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <button className="mt-2 w-full bg-white text-neutral-900 rounded-full py-3.5 shadow-lg hover:bg-neutral-50 transition-colors">
          <span style={{ fontSize: 15, fontWeight: 600 }}>Order</span>
        </button>
      </div>
    </div>
  );
}

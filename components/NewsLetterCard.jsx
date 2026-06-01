import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReliableImage from "./ReliableImage";

const posts = [
  {
    club: "Mango Lovers Club",
    avatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    image:
      "https://marketplace.canva.com/EAFO-opW4Rw/1/0/1131w/canva-beige-and-gold-modern-feminine-business-email-newsletter-hP5DyZaOmfE.jpg",
    price: "₹270",
    description:
      "Loved worldwide for their sweetness our Alphonso mangoes are a delicious delight wherever you are.",
    tint: "from-neutral-900/60 via-neutral-900/15 to-transparent",
  },
  {
    club: "Berry Garden Co.",
    avatar:
      "https://images.unsplash.com/photo-1518635017498-87f514b751ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    image:
      "https://gillde.com/wp-content/uploads/2022/10/4-Email-Newsletter-Templates-Gillde.jpg",
    price: "₹320",
    description:
      "Fresh handpicked strawberries from our farms, bursting with juicy flavor in every single bite.",
    tint: "from-neutral-900/60 via-neutral-900/15 to-transparent",
  },
  {
    club: "Citrus Society",
    avatar:
      "https://images.unsplash.com/photo-1557800636-894a64c1696f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
    image:
      "https://gillde.com/wp-content/uploads/2022/10/1-Email-Newsletter-Templates-Gillde.jpg",
    price: "₹180",
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

export function NewsLetterCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % posts.length);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const post = posts[index];

  const go = (dir) =>
    setIndex((i) => (i + dir + posts.length) % posts.length);

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-[#e4eaec] text-white"
      style={{ width: 325, height: 475 }}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={post.image}
            alt={post.club}
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
        {posts.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-3 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
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
                    src={post.avatar}
                    alt={`${post.club} avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className="truncate"
                  style={{ fontSize: 18, fontWeight: 700 }}
                >
                  {post.club}
                </span>
              </div>
              <div className="bg-black/35 backdrop-blur-md rounded-full px-4 py-1.5 shrink-0">
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {post.price}
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

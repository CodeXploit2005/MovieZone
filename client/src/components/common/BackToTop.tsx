import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isModalOpen } = useAuth();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && !isModalOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 z-[90] w-14 h-14 bg-primary text-white rounded-[1.2rem] flex items-center justify-center shadow-[0_10px_30px_rgba(229,9,20,0.3)] hover:bg-red-700 hover:-translate-y-1 transition-all border border-white/10"
        >
          <FiChevronUp size={28} strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;

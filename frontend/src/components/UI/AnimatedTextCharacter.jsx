import React from 'react';
import { motion } from 'framer-motion';

const AnimatedTextCharacter = ({ text, el: Wrapper = "p", className, stagger = 0.03, delay = 0 }) => {
    const item = {
        hidden: { y: "100%", opacity: 0, transition: { ease: [0.455, 0.03, 0.515, 0.955], duration: 0.5 } },
        visible: { y: 0, opacity: 1, transition: { ease: [0.455, 0.03, 0.515, 0.955], duration: 0.4 } }
    };
    const container = {
        visible: {
            transition: {
                staggerChildren: stagger,
                delayChildren: delay,
            }
        }
    };

    const splitWords = text.split(" ");
    const words = [];
    splitWords.forEach(word => {
        words.push(word.split(""));
        words.push(["\u00A0"]); // Add space character array
    });
    words.pop(); // Remove last space

    return (
        <Wrapper className={className}>
            <motion.span style={{ display: "inline-block" }} variants={container} initial="hidden" animate="visible">
                {words.map((wordChars, wordIndex) => (
                    <span key={wordIndex} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                        {wordChars.map((char, charIndex) => (
                            <motion.span
                                key={`${char}-${charIndex}`}
                                style={{ display: "inline-block" }}
                                variants={item}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </span>
                ))}
            </motion.span>
        </Wrapper>
    );
};
export default AnimatedTextCharacter;
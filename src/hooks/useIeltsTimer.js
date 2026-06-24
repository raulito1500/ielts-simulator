import { useState, useEffect, useRef, useCallback } from 'react';

const useIeltsTimer = (initialTime, onTimeUp) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [timerActive, setTimerActive] = useState(false);
    const timerRef = useRef(null);

    const startTimer = useCallback(() => {
        if (!timerActive) {
            setTimerActive(true);
        }
    }, [timerActive]);

    const endTimer = useCallback(() => {
        clearInterval(timerRef.current);
        setTimerActive(false);
        onTimeUp();
    }, [onTimeUp]);

    const resetTimer = useCallback(() => {
        clearInterval(timerRef.current);
        setTimerActive(false);
        setTimeLeft(initialTime);
    }, [initialTime]);

    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        endTimer();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive, endTimer]);

    return { timeLeft, timerActive, startTimer, endTimer, resetTimer };
};

export default useIeltsTimer;

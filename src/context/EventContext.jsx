"use client";

import { createContext, useContext, useReducer } from "react";

const EventContext = createContext();

const initialState = {
    mode: "create",
    eventData: {
        title: "",
        description: "",
        location: "",
        hostEmail: "",
        duration: 60,
    },
    selectedSlots: [],
    originalProposedSlots: [],
};

const eventReducer = (state, action) => {
    switch (action.type) {
        case "RESET":
            return initialState;
        case "SET_MODE":
            return { ...state, mode: action.payload };
        case "UPDATE_EVENT_DATA":
            return { ...state, eventData: { ...state.eventData, ...action.payload } };
        case "SET_SLOTS":
            return { ...state, selectedSlots: action.payload };
        case "ADD_SLOT":
            return { ...state, selectedSlots: [...state.selectedSlots, action.payload] };
        case "REMOVE_SLOT":
            return {
                ...state,
                selectedSlots: state.selectedSlots.filter(
                    s => s.start !== action.payload.start
                )
            };
        case "LOAD_EVENT":
            const loadedData = action.payload;
            return {
                ...state,
                ...loadedData,
                originalProposedSlots: loadedData.selectedSlots || []
            };
        default:
            return state;
    }
};

export const EventProvider = ({ children }) => {
    const [state, dispatch] = useReducer(eventReducer, initialState);

    return (
        <EventContext.Provider value={{ state, dispatch }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error("useEvent must be used within an EventProvider");
    }
    return context;
};

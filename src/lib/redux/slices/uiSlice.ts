import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Theme = "dark" | "light";

export interface UIState {
  theme: Theme;
}

const initialState: UIState = {
  theme: "light"
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
    }
  }
});

export const { setTheme, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;


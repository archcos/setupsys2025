export function GlobalDarkModeStyles() {
  return (
    <style>{`
      /* ==================== DARK MODE - INPUT TEXT COLOR TO BLACK ==================== */
      .dark input[type="text"],
      .dark input[type="email"],
      .dark input[type="password"],
      .dark input[type="number"],
      .dark input[type="date"],
      .dark input[type="time"],
      .dark input[type="search"],
      .dark textarea {
        color: #000000 !important;
      }

      .dark select {
        color: #000000 !important;
      }

      .dark select option {
        color: #000000 !important;
      }
    `}</style>
  );
}

export { GlobalDarkModeStyles as default };
// Watchlist Manager using LocalStorage
window.WatchlistManager = {
  STORAGE_KEY: 'movie_streaming_watchlist',
  listeners: [],

  // Fetch list of movie IDs in the watchlist
  get() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error reading watchlist from local storage:", e);
      return [];
    }
  },

  // Save the list of movie IDs
  save(list) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      this.notifyListeners();
    } catch (e) {
      console.error("Error saving watchlist to local storage:", e);
    }
  },

  // Check if a movie is in the watchlist
  has(movieId) {
    const list = this.get();
    return list.includes(movieId);
  },

  // Add a movie to the watchlist
  add(movieId) {
    const list = this.get();
    if (!list.includes(movieId)) {
      list.push(movieId);
      this.save(list);
    }
  },

  // Remove a movie from the watchlist
  remove(movieId) {
    const list = this.get();
    const index = list.indexOf(movieId);
    if (index !== -1) {
      list.splice(index, 1);
      this.save(list);
    }
  },

  // Toggle watchlist state
  toggle(movieId) {
    if (this.has(movieId)) {
      this.remove(movieId);
      return false; // Removed
    } else {
      this.add(movieId);
      return true; // Added
    }
  },

  // Add callback listener for watchlist changes
  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  },

  notifyListeners() {
    const currentList = this.get();
    this.listeners.forEach(cb => {
      try {
        cb(currentList);
      } catch (err) {
        console.error("Error invoking watchlist listener:", err);
      }
    });
  }
};

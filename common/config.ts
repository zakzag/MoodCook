
export const config = {
  mongodb: {
    uri: "mongodb://localhost:27017/moodcook",
    dbName: "moodcook"
  },
  ai: {
    gemini: {
      model: "gemini-3-flash-preview",
      temperature: 0.7
    }
  },
  api: {
    port: 3000,
    baseUrl: "http://localhost:3000/api"
  }
};

import axios from "axios";

const wpApi = axios.create({
  baseURL: "http://staging-plugin-test.test/wp-json/wp/v2",
});

export const fetchPosts = async (perPage: number = 5) => {
  const res = await wpApi.get("/posts", {
    params: { per_page: perPage, _embed: true },
  });
  return res.data;
};

export const fetchCategories = async () => {
  const res = await wpApi.get("/categories", {
    params: { per_page: 100, _fields: "id,name,slug" },
  });
  return res.data;
};

export const fetchMedia = async (id: number | string) => {
  const res = await wpApi.get(`/media/${id}`);
  return res.data;
};
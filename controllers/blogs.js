const blogRouter = require("express").Router();
const Blog = require("../models/blog");


blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogRouter.post("/", async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: "token missing or invalid" });
  }
  const blog = new Blog(request.body);
  if (!blog.title || !blog.url) {
    return response.status(400).json({ error: "title and url are required" });
  }
  blog.likes = blog.likes || 0;
  blog.user = user._id;
  user.blogs = user.blogs.concat(blog._id);
  await user.save();
  const savedBlog = await blog.save();
  const populatedBlog = await savedBlog.populate("user", {
    username: 1,
    name: 1,
  });
  response.status(201).json(populatedBlog);
});

blogRouter.put("/:id", async (request, response) => {
  const { title, author, url, likes } = request.body;
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    if (!title || !url) {
      return response.status(400).json({ error: "title and url are required" });
    }
    blog.title = title;
    blog.url = url;
    blog.author = author;
    blog.likes = likes || 0;
    const updatedBlog = await blog.save();
    response.json(updatedBlog);
  } else {
    response.status(400).json({ error: "id does not exist" });
  }
});

blogRouter.delete("/:id", async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const blog = await Blog.findById(request.params.id);
  if (!blog) {
    return response.status(400).json({ error: "id does not exist" });
  }
  if (blog.user && blog.user.toString() !== user._id.toString()) {
    return response
      .status(403)
      .json({ error: "only the creator can delete the blog" });
  }

  await Blog.findByIdAndDelete(request.params.id);
  user.blogs = user.blogs.filter((b) => b.toString() !== request.params.id);
  await user.save();
  response.status(204).end();
});

module.exports = blogRouter;

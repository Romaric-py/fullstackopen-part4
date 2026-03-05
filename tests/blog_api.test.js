const assert = require("node:assert");
const { test, after, beforeEach, describe } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./test_helper");

const api = supertest(app);

describe("when there is initially one user saved", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.createUser(helper.rootUserData);
  });

  test("fetching users returns the correct amount of users as JSON in the expected format", async () => {
    const response = await api
      .get("/api/users")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const users = response.body;
    const user = users[0];
    assert.strictEqual(users.length, 1);
    assert(user.id !== undefined);
    assert.strictEqual(user.username, helper.rootUserData.username);
    assert.strictEqual(user.name, helper.rootUserData.name);
    // Ensure neither passwordHash nor password is included in the response
    assert.strictEqual(user.passwordHash, undefined);
    assert.strictEqual(user.password, undefined);
  });

  test("creation succeeds with a not already-used username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "randomuser",
      name: "Random User",
      password: "very-hard-to-guess",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "sekret",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(result.body.error.includes("expected `username` to be unique"));

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("user creation should fail if password is missing or shorter than 3 characters", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUserWithoutPassword = {
      username: "userwithoutpassword",
      name: "User Without Password",
    };

    const newUserWithShortPassword = {
      username: "usershortpassword",
      name: "User Short Password",
      password: "pw",
    };

    for (const newUser of [newUserWithoutPassword, newUserWithShortPassword]) {
      const response = await api
        .post("/api/users")
        .send(newUser)
        .expect(400)
        .expect("Content-Type", /application\/json/);
      assert(
        response.body.error.includes(
          "password is required and must be at least 3 characters long",
        ),
      );
    }

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("user creation should fail if username is missing or shorter than 3 characters", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUserWithoutUsername = {
      name: "User Without Username",
      password: "validpassword",
    };

    const newUserWithShortUsername = {
      username: "us",
      name: "User Short Username",
      password: "validpassword",
    };

    let response = await api
      .post("/api/users")
      .send(newUserWithoutUsername)
      .expect(400)
      .expect("Content-Type", /application\/json/);
    assert(response.body.error.includes("Path `username` is required."));

    response = await api
      .post("/api/users")
      .send(newUserWithShortUsername)
      .expect(400)
      .expect("Content-Type", /application\/json/);
    assert(
      response.body.error.includes(
        "is shorter than the minimum allowed length",
      ),
    );

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("a HTTP POst request to /api/login with valid credentials returns a token", async () => {
    const loginData = {
      username: "root",
      password: "sekret",
    };

    const response = await api
      .post("/api/login")
      .send(loginData)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert(response.body.token);
  });

  test("a HTTP POST request to /api/login with invalid credentials fails with status code 401", async () => {
    const invalidPasswordData = {
      username: "root",
      password: "wrongpassword",
    };
    const invalidUsernameData = {
      username: "nonexistentuser",
      password: "sekret",
    };

    for (const invalidLoginData of [invalidPasswordData, invalidUsernameData]) {
      await api
        .post("/api/login")
        .send(invalidLoginData)
        .expect(401)
        .expect("Content-Type", /application\/json/);
    }
  });

  test("a HTTP POST request to /api/login with missing username or password fails with status code 400", async () => {
    const missingUsernameData = {
      password: "sekret",
    };
    const missingPasswordData = {
      username: "root",
    };

    for (const invalidLoginData of [missingUsernameData, missingPasswordData]) {
      await api
        .post("/api/login")
        .send(invalidLoginData)
        .expect(400)
        .expect("Content-Type", /application\/json/);
    }
  });
});

const loginRootUserAndGetToken = async () => {
  const loginData = {
    username: "root",
    password: "sekret",
  };

  const response = await api
    .post("/api/login")
    .send(loginData)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  return response.body.token;
};

const createInitialBlogsForRootUser = async () => {
  const rootUser = await User.findOne({
    username: helper.rootUserData.username,
  });
  const initialBlogs = helper.initialBlogs.map((blog) => ({
    ...blog,
    user: rootUser._id,
  }));
  await Blog.insertMany(initialBlogs);
  // Update the user's blogs array with the initial blogs ids
  rootUser.blogs = initialBlogs.map((blog) => blog._id);
  await rootUser.save();
};

describe("when there are initially some blogs saved and one user created", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});
    await helper.createUser(helper.rootUserData);
    await createInitialBlogsForRootUser();
  });

  test("an HTTP GET request to the /api/blogs URL returns the correct amount the blog posts as JSON", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogs = response.body;
    assert.strictEqual(blogs.length, helper.initialBlogs.length);
  });

  test("the unique identifier property of the blog posts is named id", async () => {
    const response = await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const blogs = response.body;
    blogs.forEach((blog) => {
      assert.notStrictEqual(blog.id, undefined);
      assert.strictEqual(blog._id, undefined);
    });
  });

  describe("addition of a new blog", () => {
    test("an HTTP POST request to the /api/blogs URL should failed, when credentials are missing", async () => {
      const newBlog = {
        title: "Test Blog",
        author: "Test Author",
        url: "http://example.com/test-blog",
        likes: 5,
      };

      await api.post("/api/blogs").send(newBlog).expect(401);
    });

    test("an HTTP POST request to the /api/blogs URL should failed if the token is invalid", async () => {
      const newBlog = {
        title: "Test Blog",
        author: "Test Author",
        url: "http://example.com/test-blog",
        likes: 5,
      };
      const invalidToken = "ey-this-is-an-invalid-token-12345";

      await api
        .post("/api/blogs")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send(newBlog)
        .expect(401);
    });

    test("an HTTP POST request to the /api/blogs URL successfully creates a new blog post with valid data and token", async () => {
      const token = await loginRootUserAndGetToken();

      const newBlog = {
        title: "Test Blog",
        author: "Test Author",
        url: "http://example.com/test-blog",
        likes: 5,
      };

      const response = await api
        .post("/api/blogs")
        .send(newBlog)
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      const createdBlog = response.body;
      assert.strictEqual(createdBlog.title, newBlog.title);
      assert.strictEqual(createdBlog.author, newBlog.author);
      assert.strictEqual(createdBlog.url, newBlog.url);
      assert.strictEqual(createdBlog.likes, newBlog.likes);

      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, helper.initialBlogs.length + 1);
      const titles = blogsAfterPost.map((b) => b.title);
      assert(titles.includes(newBlog.title));

      // Ensure the created blog is associated with the correct user  and that the user's blogs array is updated
      assert.strictEqual(
        createdBlog.user.username,
        helper.rootUserData.username,
      );
      const user = await User.findOne({
        username: helper.rootUserData.username,
      }).populate("blogs");
      const userBlogTitles = user.blogs.map((b) => b.title);
      assert(userBlogTitles.includes(newBlog.title));
    });

    test("if the likes property is missing from the request, it will default to the value 0 with valid credentials", async () => {
      const token = await loginRootUserAndGetToken();

      const newBlogWithoutLikes = {
        title: "Test Blog Without Likes",
        author: "Test Author",
        url: "http://example.com/test-blog-without-likes",
      };

      const response = await api
        .post("/api/blogs")
        .send(newBlogWithoutLikes)
        .set("Authorization", `Bearer ${token}`)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      const createdBlog = response.body;
      assert.strictEqual(createdBlog.likes, 0);
    });

    test("if the title or url properties are missing from the request, respond with status code 400 Bad Request, even if credentials are valid", async () => {
      const token = await loginRootUserAndGetToken();

      const newBlogWithoutTitle = {
        author: "Test Author",
        url: "http://example.com/test-blog-without-title",
        likes: 5,
      };

      const newBlogWithoutUrl = {
        title: "Test Blog Without URL",
        author: "Test Author",
        likes: 5,
      };

      await api
        .post("/api/blogs")
        .send(newBlogWithoutTitle)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);
      await api
        .post("/api/blogs")
        .send(newBlogWithoutUrl)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);
    });
  });

  describe("deletion of a blog", () => {
    test("fails with status code 401 if token is missing", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToDelete = blogsAtStart[0];

      await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
      const titles = blogsAtEnd.map((b) => b.title);
      assert(titles.includes(blogToDelete.title));
    });

    test("fails with status code 401 if token is invalid", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToDelete = blogsAtStart[0];
      const invalidToken = "ey-this-is-an-invalid-token-12345";

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set("Authorization", `Bearer ${invalidToken}`)
        .expect(401);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
      const titles = blogsAtEnd.map((b) => b.title);
      assert(titles.includes(blogToDelete.title));
    });

    test("deletes successfully the blog with status code 204 if id is valid, and the blog owner is the logged-in user", async () => {
      const token = await loginRootUserAndGetToken();
      const blogsAtStart = await helper.blogsInDb();
      const blogToDelete = blogsAtStart[0];

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(204);

      const blogsAtEnd = await helper.blogsInDb();

      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1);
      const titles = blogsAtEnd.map((b) => b.title);
      assert(!titles.includes(blogToDelete.title));
    });

    test("fails with status code 403 if the logged-in user is not the owner of the blog", async () => {
      // Create a new user and login to get a token
      const newUser = {
        username: "anotheruser",
        name: "Another User",
        password: "anotherpassword",
      };
      await helper.createUser(newUser);
      const loginData = {
        username: newUser.username,
        password: newUser.password,
      };
      const response = await api
        .post("/api/login")
        .send(loginData)
        .expect(200)
        .expect("Content-Type", /application\/json/);
      const token = response.body.token;

      // Attempt to delete a blog created by the root user with the new user's token
      const blogsAtStart = await helper.blogsInDb();
      const blogToDelete = blogsAtStart[0];

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
      const titles = blogsAtEnd.map((b) => b.title);
      assert(titles.includes(blogToDelete.title));
    });

    test("fails with status code 400 if id does not exist even if an user is logged-in", async () => {
      const token = await loginRootUserAndGetToken();
      const blogsAtStart = await helper.blogsInDb();

      const nonExistingId = await helper.nonExistingId();
      await api
        .delete(`/api/blogs/${nonExistingId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
    });

    test("fails with status code 400 if id is malformatted", async () => {
      const token = await loginRootUserAndGetToken();
      const blogsAtStart = await helper.blogsInDb();

      const malformattedId = "i-like-fullstackopen";
      await api
        .delete(`/api/blogs/${malformattedId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, blogsAtStart.length);
    });
  });

  describe("updating a blog", () => {
    const updatedBlogData = {
      title: "Updated Title",
      author: "Updated Author",
      url: "http://example.com/updated-blog",
      likes: 20,
    };

    test("updates successfully the blog with status code 200 if id is valid", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToUpdate = blogsAtStart[0];

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlogData)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      const updatedBlog = response.body;
      assert.strictEqual(updatedBlog.title, updatedBlogData.title);
      assert.strictEqual(updatedBlog.author, updatedBlogData.author);
      assert.strictEqual(updatedBlog.url, updatedBlogData.url);
      assert.strictEqual(updatedBlog.likes, updatedBlogData.likes);

      const blogsAtEnd = await helper.blogsInDb();
      const updatedBlogInDb = blogsAtEnd.find((b) => b.id === blogToUpdate.id);
      assert(updatedBlogInDb.user.toString() === blogToUpdate.user.toString());
      // Remove the user field from both objects before deep comparison
      delete updatedBlogInDb.user;
      delete updatedBlog.user;
      assert.deepStrictEqual(updatedBlogInDb, updatedBlog);
    });

    test("fails with status code 400 if id does not exist", async () => {
      const nonExistingId = Array(24).fill("0").join("");
      await api
        .put(`/api/blogs/${nonExistingId}`)
        .send(updatedBlogData)
        .expect(400);
    });

    test("fails with status code 400 if id is malformatted", async () => {
      const malformattedId = "malformatted-id";
      await api
        .put(`/api/blogs/${malformattedId}`)
        .send(updatedBlogData)
        .expect(400);
    });

    test("fails with status code 400 if title or url is missing", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToUpdate = blogsAtStart[0];

      const updatedBlogWithoutTitle = {
        author: "Updated Author",
        url: "http://example.com/updated-blog",
        likes: 20,
      };

      const updatedBlogWithoutUrl = {
        title: "Updated Title",
        likes: 20,
      };

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlogWithoutTitle)
        .expect(400);

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlogWithoutUrl)
        .expect(400);
    });

    test("if the likes property is missing from the request, it will default to the value 0", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToUpdate = blogsAtStart[0];

      const updatedBlogWithoutLikes = {
        title: "Updated Title",
        author: "Updated Author",
        url: "http://example.com/updated-blog",
      };

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedBlogWithoutLikes)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      const updatedBlog = response.body;
      assert.strictEqual(updatedBlog.likes, 0);
    });
  });
});

after(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

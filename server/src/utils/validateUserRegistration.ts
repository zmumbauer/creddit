import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateUserRegistration = (options: UsernamePasswordInput) => {
    // Check that username has at least 4 characters
    if (options.username.length < 4) {
        return [
            {
              field: "username",
              message: "Username must have at least 4 characters",
            },
          ];
      }
  
      // Check that email has at an @
      if (!options.email.includes('@')) {
        return [
            {
              field: "email",
              message: "Email is invalid",
            },
          ];
      }
  
      // Check that username doesn't have @
      if (options.username.includes('@')) {
        return [
            {
              field: "username",
              message: "Username cannot have '@'",
            },
          ];
      }

      // Check that password has at least 8 characters
      if (options.password.length < 8) {
        return [
            {
              field: "password",
              message: "Password must have at least 8 characters",
            },
          ];
      }

      return null;
}
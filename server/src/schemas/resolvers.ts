import { User } from '../models/index.js';
import { signToken, AuthenticationError } from '../services/auth.js';

interface User {
    _id: string;
    username: string;
    email: string;
    password: string;
    bookCount: number;
    savedBooks: Book[];
}

interface Book {
    bookId: string;
    authors: string[];
    description: string;
    title: string;
    image: string;
    link: string;
}

interface AddUserArgs {
    input:{
        username: string;
        email: string;
        password: string;
    }
}

interface SaveBookArgs {
    bookData: Book;
}

interface RemoveBookArgs {
    bookId: string;
}

interface Context {
    user?: User;
}

const resolvers = {
    Query: {
        me: async (_parent: unknown, _args: unknown, context: Context): Promise<User | null> => {
            if (context.user) {
                return await User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    },
    Mutations: {
        // login a user using email or username
        login: async (_parent: unknown, { email, password }: { email: string, password: string }): Promise<{ token: string, user: User }> => {
            const user = await User.findOne({ $or: [{ username: email }, { email: email }] });
            if (!user) {
                throw new AuthenticationError(`Can't find this user`);
            }

            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Wrong password!');
            }

            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },

        // create a new user
        addUser: async (_parent: unknown, { input }: AddUserArgs): Promise<{ token: string, user: User }> => {
            const user = await User.create({ ...input });
            const token = signToken(user.username, user.password, user._id);
            return { token, user };
        },

        saveBook: async (_parent: unknown, { bookData }: SaveBookArgs, context: Context): Promise<User | null> => {
            if(context.user) {
                return await User.findOneAndUpdate(
                    { _id: context.user?._id },
                    { $addToSet: { savedBooks: bookData } },
                    { new: true, runValidators: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },

        removeBook: async (_parent: unknown, { bookId }: RemoveBookArgs, context: Context): Promise<User | null> => {
            if(context.user) {
                return await User.findOneAndUpdate(
                    { _id: context.user?._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    }
}

export default resolvers;
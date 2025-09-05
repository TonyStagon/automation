import { SchemaType } from '@google/generative-ai';

// Twitter Comment Schema definition
export const getTwitterCommentSchema = () => {
    return {
        ...{
            type: SchemaType.OBJECT,
            properties: {
                ...{
                    comment: {
                        ...{
                            type: SchemaType.STRING,
                            description: "A thoughtful reply to the given tweet. Maximum 280 characters.",
                        }
                    }
                }
            },
            required: Array.from(["comment"]) // Fully mutable array
        }
    };
};
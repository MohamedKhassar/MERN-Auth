import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import "dotenv/config"
import { Request, Response } from "express"
import UserModel, { User } from "../Models/UserModel"
import bcrypt from "bcryptjs"
import RoleModel from "../Models/RoleModel"
import { handelError } from "../Error/handelError"
import { CustomUser } from "../Middlewares/PermissionMiddleware"
const JWT_SECRET: any = process.env.JWT_SECRET
const createToken = (id: mongoose.Types.ObjectId) => {
    const token = jwt.sign({ id }, JWT_SECRET, {
        expiresIn: "1d",
    });
    return token
}
export const signUp = async (req: Request, res: Response) => {
    const { username, email, password } = req.body
    const user = await UserModel.findOne({ email, username })
    try {
        if (user) {
            res.status(400).json({ message: "User already exists" })
        } else {
            const user = await (await UserModel.create(req.body)).populate<{ role: CustomUser }>("role")
            const token = createToken(user._id)
            res.cookie("access_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 1000 })
            res.status(201).json({ message: "User created", username: user.username, email, role: user.role.name, token })
        }
    } catch (error: any) {
        const errorMessage = handelError(error)
        res.status(400).json(errorMessage)
    }
}

export const signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email }).populate<{ role: CustomUser }>("role")
    try {
        if (user) {
            const isPassword = bcrypt.compareSync(password, user.password)
            if (isPassword) {
                const token = createToken(user._id)
                res.cookie("access_token", token, { httpOnly: true, maxAge: 60 * 60 * 24 * 1000 })
                res.status(200).json({ username: user.username, email, role: user.role?.name, token })
            }
            else {
                return res.status(400).json({ message: "Invalid password" })
            }
        }
        else {
            return res.status(400).json({ message: "email not found" })
        }
    } catch (error) {
        console.log(error)
    }
}

export const logOut = (req: Request, res: Response) => {
    try {
        res.clearCookie("access_token")
        res.status(200).json({ message: "Logged out" })
    } catch (error) {
        console.log(error)
    }
}



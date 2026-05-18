import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,        // null if signed up via Google OAuth
    },

    authProvider: {
      type: String,
      enum: ['email', 'google'],
      required: true,
      default: 'email',
    },

    photoURL: {
      type: String,
      default: null,        // populated automatically from Google profile
    },

    analysisCount: {
      type: Number,
      default: 0,           // incremented every time a report is saved
    },

    plan: {
      type: String,
      enum: ['free'],       // extend to ['free', 'pro'] later
      default: 'free',
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,       // adds createdAt and updatedAt automatically
  }
)

// hash password before saving — only if password was changed
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
})

// method to check password at login
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false
  return await bcrypt.compare(enteredPassword, this.password)
}

// never return password in API responses
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

const User = mongoose.model('User', userSchema)
export default User

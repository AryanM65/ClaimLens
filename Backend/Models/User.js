import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
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
      default: null,
    },

    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
      }
    ],

    // Linked organization (only set when role === 'organization')
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },

    plan: {
      type: String,
      enum: ['free'],       // extend to ['free', 'pro'] later
      default: 'free',
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'organization'],
      default: 'user',
    },

    isBanned: {
      type: Boolean,
      default: false,
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

// Hash password before saving — only if password was changed
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
})

// Method to check password at login
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false
  return await bcrypt.compare(enteredPassword, this.password)
}

// Never return password or __v in API responses
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  delete user.__v
  return user
}

const User = mongoose.model('User', userSchema)
export default User

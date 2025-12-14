const mongoose = require("mongoose");

const CCLTeamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      unique: true, // Ensures no two teams have the same name
      trim: true,
    },

    // LEADER (Linked to CCLDB)
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CCLDB", // This matches the model name in your previous file
      required: true,
    },

    // MEMBER 2 (Linked to CCLDB)
    member2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CCLDB",
      required: true,
    },

    // MEMBER 3 (Linked to CCLDB)
    member3: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CCLDB",
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CCLTeam", CCLTeamSchema);
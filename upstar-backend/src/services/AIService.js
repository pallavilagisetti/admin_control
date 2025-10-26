const OpenAI = require('openai');
const { logger } = require('../middleware/errorHandler');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Extract skills from resume text using GPT-4
  async extractSkillsFromResume(resumeText) {
    try {
      const prompt = `
        Analyze the following resume text and extract:
        1. Technical skills (programming languages, frameworks, tools)
        2. Soft skills (leadership, communication, etc.)
        3. Education level and field
        4. Years of experience
        5. Job titles and roles
        6. Certifications
        7. Languages spoken
        8. Location
        
        Resume text: ${resumeText}
        
        Return the response as a JSON object with the following structure:
        {
          "skills": ["skill1", "skill2", ...],
          "education": "degree and field",
          "experience": "years of experience",
          "summary": "brief professional summary",
          "certifications": ["cert1", "cert2", ...],
          "languages": ["language1", "language2", ...],
          "location": "city, state/country",
          "jobTitles": ["title1", "title2", ...]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert resume parser. Extract structured information from resume text and return it as valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const extractedData = JSON.parse(response.choices[0].message.content);
      
      // Validate and clean the extracted data
      return this.validateExtractedData(extractedData);
    } catch (error) {
      logger.error('AI skill extraction failed:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  // Match user skills with job requirements
  async matchUserWithJobs(userSkills, jobRequirements) {
    try {
      const prompt = `
        Match the following user skills with job requirements and calculate a compatibility score.
        
        User Skills: ${userSkills.join(', ')}
        Job Requirements: ${jobRequirements.join(', ')}
        
        Return a JSON object with:
        {
          "matchScore": 0-100,
          "matchedSkills": ["skill1", "skill2", ...],
          "missingSkills": ["skill1", "skill2", ...],
          "recommendations": ["suggestion1", "suggestion2", ...]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert job matching AI. Analyze skill compatibility and provide detailed matching scores."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI job matching failed:', error);
      throw new Error(`AI job matching failed: ${error.message}`);
    }
  }

  // Generate personalized job recommendations
  async generateJobRecommendations(userProfile, availableJobs) {
    try {
      const prompt = `
        Based on the user profile and available jobs, generate personalized job recommendations.
        
        User Profile:
        - Skills: ${userProfile.skills.join(', ')}
        - Experience: ${userProfile.experience}
        - Education: ${userProfile.education}
        - Location: ${userProfile.location}
        
        Available Jobs: ${JSON.stringify(availableJobs.slice(0, 10))}
        
        Return a JSON array of job recommendations with:
        {
          "jobId": "job_id",
          "matchScore": 0-100,
          "reasoning": "why this job is a good match",
          "priority": "high/medium/low"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career advisor. Provide personalized job recommendations based on user profile and job requirements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI job recommendations failed:', error);
      throw new Error(`AI job recommendations failed: ${error.message}`);
    }
  }

  // Analyze skill gaps and provide learning recommendations
  async analyzeSkillGaps(userSkills, targetRole) {
    try {
      const prompt = `
        Analyze the skill gaps for a user wanting to transition to a target role.
        
        Current Skills: ${userSkills.join(', ')}
        Target Role: ${targetRole}
        
        Return a JSON object with:
        {
          "skillGaps": [
            {
              "skill": "skill_name",
              "importance": "high/medium/low",
              "learningTime": "estimated time to learn"
            }
          ],
          "learningPath": [
            {
              "step": 1,
              "skill": "skill_name",
              "description": "what to learn",
              "resources": ["resource1", "resource2"]
            }
          ],
          "timeline": "estimated time to reach target role"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career development advisor. Analyze skill gaps and provide learning recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI skill gap analysis failed:', error);
      throw new Error(`AI skill gap analysis failed: ${error.message}`);
    }
  }

  // Generate market insights and trends
  async generateMarketInsights(skills, location) {
    try {
      const prompt = `
        Generate market insights for the following skills in the specified location.
        
        Skills: ${skills.join(', ')}
        Location: ${location}
        
        Return a JSON object with:
        {
          "demand": "high/medium/low",
          "salaryRange": {
            "min": 50000,
            "max": 100000,
            "currency": "USD"
          },
          "growthTrend": "+15%",
          "topCompanies": ["company1", "company2", "company3"],
          "emergingSkills": ["skill1", "skill2"],
          "marketInsights": "detailed market analysis"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert market analyst. Provide detailed market insights for skills and locations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI market insights failed:', error);
      throw new Error(`AI market insights failed: ${error.message}`);
    }
  }

  // Generate personalized learning recommendations
  async generateLearningRecommendations(userProfile, learningGoals) {
    try {
      const prompt = `
        Generate personalized learning recommendations based on user profile and goals.
        
        User Profile:
        - Current Skills: ${userProfile.skills.join(', ')}
        - Experience Level: ${userProfile.experienceLevel}
        - Learning Goals: ${learningGoals}
        
        Return a JSON object with:
        {
          "recommendations": [
            {
              "skill": "skill_name",
              "priority": "high/medium/low",
              "learningPath": "step-by-step learning path",
              "resources": [
                {
                  "type": "course/book/video",
                  "title": "resource title",
                  "url": "resource_url",
                  "difficulty": "beginner/intermediate/advanced"
                }
              ],
              "timeline": "estimated learning time"
            }
          ],
          "overallTimeline": "total time to reach goals"
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert learning advisor. Provide personalized learning recommendations and resources."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('AI learning recommendations failed:', error);
      throw new Error(`AI learning recommendations failed: ${error.message}`);
    }
  }

  // Validate extracted data
  validateExtractedData(data) {
    const validated = {
      skills: Array.isArray(data.skills) ? data.skills : [],
      education: typeof data.education === 'string' ? data.education : '',
      experience: typeof data.experience === 'string' ? data.experience : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      location: typeof data.location === 'string' ? data.location : '',
      jobTitles: Array.isArray(data.jobTitles) ? data.jobTitles : []
    };

    // Clean and validate skills
    validated.skills = validated.skills
      .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
      .map(skill => skill.trim())
      .slice(0, 50); // Limit to 50 skills

    return validated;
  }

  // Get AI model status and performance
  async getModelStatus() {
    try {
      // Test the model with a simple request
      const startTime = Date.now();
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message."
          }
        ],
        max_tokens: 10
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        status: 'active',
        model: 'gpt-4',
        latency: latency,
        lastTest: new Date().toISOString(),
        performance: {
          accuracy: 95.0,
          latency: latency,
          cost: 0.03
        }
      };
    } catch (error) {
      return {
        status: 'error',
        model: 'gpt-4',
        error: error.message,
        lastTest: new Date().toISOString()
      };
    }
  }

  // Test AI model with custom input
  async testModel(input, modelId = 'gpt-4') {
    try {
      const response = await this.openai.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: "user",
            content: input
          }
        ],
        max_tokens: 100
      });

      return {
        success: true,
        response: response.choices[0].message.content,
        model: modelId,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: modelId
      };
    }
  }
}

module.exports = new AIService();






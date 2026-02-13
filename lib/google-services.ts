import { google } from 'googleapis'
import { prisma } from './prisma'

export class GoogleServices {
    private oauth2Client

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
        )
    }

    /**
     * Check if a user has a valid Google connection
     */
    async checkConnection(userId: string): Promise<boolean> {
        const account = await prisma.account.findFirst({
            where: {
                userId,
                provider: 'google',
            },
        })
        return !!(account && account.access_token)
    }

    /**
     * Get an authenticated Google client for a specific user
     */
    async getAuthenticatedClient(userId: string) {
        const account = await prisma.account.findFirst({
            where: {
                userId,
                provider: 'google',
            },
        })

        if (!account || !account.access_token) {
            throw new Error('NO_GOOGLE_CONNECTION')
        }

        this.oauth2Client.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
        })

        // Handle token refresh if expired
        this.oauth2Client.on('tokens', async (tokens) => {
            if (tokens.access_token) {
                await (prisma as any).account.update({
                    where: { id: account.id },
                    data: {
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token || account.refresh_token,
                        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : account.expires_at,
                    },
                })
            }
        })

        return this.oauth2Client
    }

    /**
     * Google Calendar: Create an event with a Meet link
     */
    async createCalendarEvent(userId: string, eventData: {
        summary: string
        description?: string
        start: Date
        end: Date
        attendees?: string[]
        addMeetLink?: boolean
    }) {
        const auth = await this.getAuthenticatedClient(userId)
        const calendar = google.calendar({ version: 'v3', auth })

        const event: any = {
            summary: eventData.summary,
            description: eventData.description,
            start: {
                dateTime: eventData.start.toISOString(),
            },
            end: {
                dateTime: eventData.end.toISOString(),
            },
            attendees: eventData.attendees?.map(email => ({ email })),
        }

        if (eventData.addMeetLink) {
            event.conferenceData = {
                createRequest: {
                    requestId: `visio-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            }
        }

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
        })

        return response.data
    }

    /**
     * Google Drive: List files in a specific folder or overall
     */
    async listDriveFiles(userId: string, folderId?: string) {
        const auth = await this.getAuthenticatedClient(userId)
        const drive = google.drive({ version: 'v3', auth })

        let q = 'trashed = false'
        if (folderId) {
            q += ` and '${folderId}' in parents`
        }

        const response = await drive.files.list({
            q,
            fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
        })

        return response.data.files
    }

    /**
     * Google Drive: Create a folder
     */
    async createDriveFolder(userId: string, folderName: string, parentId?: string) {
        const auth = await this.getAuthenticatedClient(userId)
        const drive = google.drive({ version: 'v3', auth })

        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentId ? [parentId] : undefined,
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, name',
        })

        return response.data
    }
}

export const googleServices = new GoogleServices()

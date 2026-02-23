/**
 * GET /api/user/profile
 * PUT /api/user/profile
 * User profile management
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        data: {
          displayName: 'Unknown User',
          avatarUrl: null,
          bio: '',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({
        data: {
          displayName: session.user?.name || 'Unknown User',
          avatarUrl: session.user?.image || null,
          bio: '',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    try {
      const userId = session.user?.id;

      // Try to get user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
        return NextResponse.json({
          data: {
            displayName: session.user?.name || 'Unknown User',
            avatarUrl: session.user?.image || null,
            bio: '',
            timezone: 'America/Sao_Paulo',
            language: 'pt-BR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      // If no profile exists, create default one
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            display_name: session.user?.name || 'Unknown User',
            avatar_url: session.user?.image || null,
            bio: '',
            timezone: 'America/Sao_Paulo',
            language: 'pt-BR',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return NextResponse.json({
            data: {
              displayName: session.user?.name || 'Unknown User',
              avatarUrl: session.user?.image || null,
              bio: '',
              timezone: 'America/Sao_Paulo',
              language: 'pt-BR',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });
        }

        return NextResponse.json({
          data: {
            displayName: newProfile.display_name,
            avatarUrl: newProfile.avatar_url,
            bio: newProfile.bio,
            timezone: newProfile.timezone,
            language: newProfile.language,
            createdAt: newProfile.created_at,
            updatedAt: newProfile.updated_at,
          },
        });
      }

      return NextResponse.json({
        data: {
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          timezone: profile.timezone,
          language: profile.language,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        data: {
          displayName: session.user?.name || 'Unknown User',
          avatarUrl: session.user?.image || null,
          bio: '',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      data: {
        displayName: 'Unknown User',
        avatarUrl: null,
        bio: '',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        data: {
          displayName: 'Unknown User',
          avatarUrl: null,
          bio: '',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    try {
      const body = await request.json();
      const { displayName, avatarUrl, bio, language } = body;

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({
          data: {
            displayName: session.user?.name || 'Unknown User',
            avatarUrl: session.user?.image || null,
            bio: '',
            timezone: 'America/Sao_Paulo',
            language: 'pt-BR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      const userId = session.user?.id;

      // Build update object with only provided fields
      const updateData: Record<string, string | undefined> = {};
      if (displayName !== undefined) updateData.display_name = displayName;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (language !== undefined) updateData.language = language;

      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({
          data: {
            displayName: displayName || 'Unknown User',
            avatarUrl: avatarUrl || null,
            bio: bio || '',
            timezone: 'America/Sao_Paulo',
            language: language || 'pt-BR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return NextResponse.json({
        data: {
          displayName: updatedProfile.display_name,
          avatarUrl: updatedProfile.avatar_url,
          bio: updatedProfile.bio,
          timezone: updatedProfile.timezone,
          language: updatedProfile.language,
          createdAt: updatedProfile.created_at,
          updatedAt: updatedProfile.updated_at,
        },
      });
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json({
        data: {
          displayName: 'Unknown User',
          avatarUrl: null,
          bio: '',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      data: {
        displayName: 'Unknown User',
        avatarUrl: null,
        bio: '',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }
}

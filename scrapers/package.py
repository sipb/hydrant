"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Data:
* OVERRIDES: dict[str, dict[str, list]]: The list of overrides

Functions:
* run(): The main entry point.
"""

import datetime
import json
import utils

OVERRIDES = {
    "8.01": {
        "lectureRawSections": [
            "26-152/MW/0/9-10.30/F/0/9",
            "26-152/MW/0/10.30-12/F/0/11",
            "26-152/MW/0/1-2.30/F/0/1",
            "26-152/MW/0/3-4.30/F/0/3",
            "26-152/TR/0/9-10.30/F/0/10",
            "26-152/TR/0/11-12.30/F/0/12",
            "26-152/TR/0/3-4.30/F/0/4"
        ],
        "lectureSections": [
            [
                [[2, 3], [62, 3], [122, 2]],
                "26-152"
            ],
            [
                [[5, 3], [65, 3], [126, 2]],
                "26-152"
            ],
            [
                [[10, 3], [70, 3], [130, 2]],
                "26-152"
            ],
            [
                [[14, 3], [74, 3], [134, 2]],
                "26-152"
            ],
            [
                [[32, 3], [92, 3], [124, 2]],
                "26-152"
            ],
            [
                [[36, 3], [96, 3], [128, 2]],
                "26-152"
            ],
            [
                [[44, 3], [104, 3], [136, 2]],
                "26-152"
            ]
        ],
    },
    "21M.139": {
        "n": "Moments in Music Composition: Introduction to Arranging",
        "d": "Do you love listening to different covers of your favorite artists and songs? Are you intrigued by how a simple melody can be heard in a variety of styles by different ensembles and instruments? The craft of arranging previously composed music, whether one’s own or another’s, is a way to express oneself musically in a variety of timbres, sounds, and textures. We will explore arranging as a bi-directional process: reducing a large score to a piano reduction and taking something as basic as a lead sheet melody with chords and expanding it to a larger vocal or instrumental piece. As a final project students will arrange a short",
    },
    "21M.269": {
        "n": "Studies in Western Music History: Music and Dance",
        "d": "Music for dance is relatively under-studied in musicological circles but is incredibly important to our society and culture as a whole. This semester, we’ll explore a number of topics related to music for dance(rs) in a variety of genres, including ballet, musical theater, modern/contemporary dance, and social/ballroom dance. Students may suggest questions and pieces of music/dance for us to study together. We’ll explore how composers write dance for specific choreography/choreographers, as well as the reverse: how choreographers make choices that emphasize a particular interpretation of the music. Through intensive listening, watching, and dancing ourselves, we’ll investigate questions about what music affords to dance(rs) and vice versa, and the semester will culminate with projects/presentations focused on a topic of the student’s choice.",
    },
    "21M.296": {
        "n": "Studies in Jazz and Popular Music: Hip Hop",
        "d": "This course surveys 50 years of hip-hop, examining tradition and innovation, regional accents, and core conventions in the arts of beat-making, DJing, and rapping, with reference to visual art and media, fashion, language, and related aesthetic practices.",
    },
    "21M.359": {
        "n": "Studies in Musical Comp, Theory, and Analysis: Songwriting",
        "d": "Demystifying the process and empowering student writers since 2022! There is no “best” or “correct” way to write a song. Journey with your peers through weekly projects that explore the process from as many angles as possible and discover the ways that best resonate with you. The class will analyze music from many eras and genres and also include visits from modern artists. Each student will end the class by presenting a personal songwriting portfolio. Students enrolled in this class are expected to have a basic understanding of music theory, as we will be talking about melodic and harmonic structures, analyzing chord progressions, and writing melodies using standard music notation.",
    },
    "21M.443": {
        "n": "Vocal Jazz Ensemble",
        "d": "The MIT Vocal Jazz Ensemble is an audition-based group of up to 16 singers. Students will have the opportunity to sing both with the ensemble and as a soloist at one of two or more performances each semester. MIT VJE performs both traditional and contemporary vocal jazz music, including student compositions and arrangements. The group is also invited to learn from exciting visiting jazz artists each year. Exploring improvisation, history, and style, the MIT Vocal Jazz Ensemble is a vital part of the MIT jazz community.",
    },
    "21M.S53": {
        "n": "Axiom Chamber Orchestra",
        "d": "An axiom is defined as an established rule or principle, a self-evident truth. It also stems from the word axios which means “worthy.”\nThere are musical works which don’t quite fit into the context of a typical large-ensemble concert nor chamber music concert but are most certainly worthy works of art. AXIOM, MIT’s newest ensemble, will explore such musical works. This auditioned group will meet twice a week over the course of a quarter and culminate in a public performance. This fall, the ensemble will present the complete Appalachian Spring of Aaron Copland in its original instrumentation, andLa creation du monde of Darius Milhaud. For audition requirements and other information, please email Dr. Adam Boyles.",
    },
    "21M.S54": {
        "n": "Axiom Chamber Orchestra",
        "d": "An axiom is defined as an established rule or principle, a self-evident truth. It also stems from the word axios which means “worthy.”\nThere are musical works which don’t quite fit into the context of a typical large-ensemble concert nor chamber music concert but are most certainly worthy works of art. AXIOM, MIT’s newest ensemble, will explore such musical works. This auditioned group will meet twice a week over the course of a quarter and culminate in a public performance. This fall, the ensemble will present the complete Appalachian Spring of Aaron Copland in its original instrumentation, andLa creation du monde of Darius Milhaud. For audition requirements and other information, please email Dr. Adam Boyles.",
    },
    "21T.100": {
        "n": "Theater Arts Presents “Life is a Dream,” adapted from the play by Calderón de la Barca",
        "d": "This course will allow students to join Theater Arts faculty and staff in the development of a fully staged production of La Vida es Sueño/Life is a Dream adapted from the classic play by Calderón de la Barca for a live audience in W97. Weekly rehearsals, design labs, and workshops will introduce students to an array of performance techniques over the course of the term. The semester will culminate in a public performance and is open to students at all levels of experience. All are welcome to join!",
    },
    "21T.202": {
        "n": "Live Solo Performance",
        "d": "This course allows for the study of the theatrical canon of monodramas and solo performances in an effort to hone one’s individual acting skills. The intent is to explore each student’s original artistic voice by presenting strategies in composing and staging work with introductions to experiments in performing oneself in society. Each student will create their own original performance piece by the end of the term. Enrollment is limited but open to students at all levels of experience.",
    },
    "21T.203": {
        "n": "Music Theater Workshop",
        "d": "This course will introduce applications of music in theater and performance; encourage experimentation with different genres of singing, acting, and movement; and explore an array of historical and contemporary styles and techniques. Students will develop and perform their own original songs and textual materials in order to gain a theoretical and practical understanding of the actor’s contribution to the craft. Previous experience",
    },
    "21T.210": {
        "n": "Choreography: Making Dances",
        "d": "This workshop course will be focused on choreographic methods and principles as the launching point for building dramatic performance. Participants will propose pieces they would like to develop as solos, duets, group works, etc. and the class will both lay the groundwork for generating material while focusing on defining and expanding each person’s unique voice as a creator of performance. The class will culminate in public performances of the students’ work.",
    },
    "21T.331": {
        "n": "Live Cinema Performance",
        "d": "This interdisciplinary studio course will introduce the theoretical basis, technical idiosyncrasies, and artistic practices of live cinema performance. Students will examine the integration of theatrical and cinematic idioms by considering the merging of such disciplines from both sides of the camera. Each student will be encouraged to develop their own artistic visions culminating in a research-driven, full-length collaboration to be presented in the final week of class for an invited live audience.",
    },
    "21T.420": {
        "n": "Topics in Performance Technique: Hip-Hop",
        "d": "This course is intended to explore how hip-hop music was born out of the necessity to express one’s true self in the face of adversity. Students will be offered hip-hop dance instruction for all levels of experience. Discussions, lectures, and demonstrations will trace the roots of the genre back to the cultures of West Africa while investigating its style of musicality through gesture, beat, and polyrhythmic analysis.",
    },
    "21T.421": {
        "n": "Topics in Performance Practice: Contemporary Dance",
        "d": "Floor work, improvisation, and partnering will be explored and honed in this intermediate course to guide students through learning and executing choreography. Students will embark on a deep exploration of how our bodies inhabit and interact with space with an emphasis on the transformation of phrases into ensemble, solo, and duet materials.",
    },
    # "2.00B": {
    #     "b": [],
    #     "tb": True,
    # },
    # "22.05": {
    #     "l": [[[[33, 3], [93, 3]], "24-121"]],
    #     "r": [[[[124, 2]], "24-121"]],
    # },

    # Per instructor request. Fireroad seems to be getting it wrong...
    "12.387": {
        "lectureRawSections": [
            "54-209/R/0/9-12"
        ],
        "lectureSections": [
            [[[92, 6]], '54-209']
        ]
    },

    # Corrected schedules for the math department.
    # Generated by math_dept.py
    '18.03': {'lectureRawSections': '26-100/MWF/0/1',
           'lectureSections': [[[[10, 2], [70, 2], [130, 2]], '26-100']]},
    '18.04': {'lectureRawSections': '2-131/MW/0/11-12.30',
            'lectureSections': [[[[6, 3], [66, 3]], '2-131']]},
    '18.06': {'lectureRawSections': '26-100/MWF/0/11',
            'lectureSections': [[[[6, 2], [66, 2], [126, 2]], '26-100']]},
    '18.062': {'lectureRawSections': '26-100/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '26-100']]},
    '18.085': {'lectureRawSections': '2-190/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '2-190']]},
    '18.100A': {'lectureRawSections': '1-190/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '1-190']]},
    '18.100B': {'lectureRawSections': '4-163/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '4-163']]},
    '18.100Q': {'lectureRawSections': '2-151/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-151']]},
    '18.101': {'lectureRawSections': '2-139/TR/0/9.30-11',
                'lectureSections': [[[[33, 3], [93, 3]], '2-139']]},
    '18.104': {'lectureRawSections': '2-151/MW/0/11-12.30',
                'lectureSections': [[[[6, 3], [66, 3]], '2-151']]},
    '18.112': {'lectureRawSections': '45-102/MW/0/9.30-11',
                'lectureSections': [[[[3, 3], [63, 3]], '45-102']]},
    '18.137': {'lectureRawSections': '2-142/TR/0/9.30-11',
                'lectureSections': [[[[33, 3], [93, 3]], '2-142']]},
    '18.152': {'lectureRawSections': '56-154/MW/0/11-12.30',
                'lectureSections': [[[[6, 3], [66, 3]], '56-154']]},
    '18.155': {'lectureRawSections': '2-131/MW/0/1-2.30',
                'lectureSections': [[[[10, 3], [70, 3]], '2-131']]},
    '18.204': {'lectureRawSections': '2-151/MW/0/9.30-11',
                'lectureSections': [[[[3, 3], [63, 3]], '2-151']]},
    '18.211': {'lectureRawSections': '32-124/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '32-124']]},
    '18.217': {'lectureRawSections': '2-190/MWF/0/1',
                'lectureSections': [[[[10, 2], [70, 2], [130, 2]], '2-190']]},
    '18.226': {'lectureRawSections': '45-102/MW/0/2.30-4',
                'lectureSections': [[[[13, 3], [73, 3]], '45-102']]},
    '18.338': {'lectureRawSections': '2-147/MW/0/3-4.30',
                'lectureSections': [[[[14, 3], [74, 3]], '2-147']]},
    '18.353': {'lectureRawSections': '2-131/TR/0/9.30-11',
                'lectureSections': [[[[33, 3], [93, 3]], '2-131']]},
    '18.367': {'lectureRawSections': '2-139/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-139']]},
    '18.384': {'lectureRawSections': '2-151/TR/0/9.30-11',
                'lectureSections': [[[[33, 3], [93, 3]], '2-151']]},
    '18.404': {'lectureRawSections': '54-100/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '54-100']]},
    '18.4041': {'lectureRawSections': '54-100/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '54-100']]},
    '18.408': {'lectureRawSections': '2-132/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-132']]},
    '18.410': {'lectureRawSections': '34-101/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '34-101']]},
    '18.415': {'lectureRawSections': '32-123/MWF/0/2.30-4',
                'lectureSections': [[[[13, 3], [73, 3], [133, 3]], '32-123']]},
    '18.418': {'lectureRawSections': '8-119/MW/0/11.30-1',
                'lectureSections': [[[[7, 3], [67, 3]], '8-119']]},
    '18.424': {'lectureRawSections': '2-131/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '2-131']]},
    '18.434': {'lectureRawSections': '2-146/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '2-146']]},
    '18.435': {'lectureRawSections': '4-370/MWF/0/1',
                'lectureSections': [[[[10, 2], [70, 2], [130, 2]], '4-370']]},
    '18.600': {'lectureRawSections': '34-101/MW/0/11-12.30',
                'lectureSections': [[[[6, 3], [66, 3]], '34-101']]},
    '18.642': {'lectureRawSections': '32-124/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '32-124']]},
    '18.650': {'lectureRawSections': '2-190/MWF/0/10',
                'lectureSections': [[[[4, 2], [64, 2], [124, 2]], '2-190']]},
    '18.6501': {'lectureRawSections': '2-190/MWF/0/10',
                'lectureSections': [[[[4, 2], [64, 2], [124, 2]], '2-190']]},
    '18.675': {'lectureRawSections': '32-155/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '32-155']]},
    '18.700': {'lectureRawSections': '6-120/MW/0/9.30-11',
                'lectureSections': [[[[3, 3], [63, 3]], '6-120']]},
    '18.701': {'lectureRawSections': '2-190/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-190']]},
    '18.704': {'lectureRawSections': '2-146/MW/0/1-2.30',
                'lectureSections': [[[[10, 3], [70, 3]], '2-146']]},
    '18.705': {'lectureRawSections': '2-139/MW/0/3-4.30',
                'lectureSections': [[[[14, 3], [74, 3]], '2-139']]},
    '18.725': {'lectureRawSections': '2-142/MWF/0/9',
                'lectureSections': [[[[2, 2], [62, 2], [122, 2]], '2-142']]},
    '18.745': {'lectureRawSections': '2-146/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '2-146']]},
    '18.785': {'lectureRawSections': '2-139/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '2-139']]},
    '18.821': {'lectureRawSections': '2-135/MW/0/2-4',
                'lectureSections': [[[[12, 4], [72, 4]], '2-135']]},
    '18.901': {'lectureRawSections': '4-163/TR/0/2.30-4',
                'lectureSections': [[[[43, 3], [103, 3]], '4-163']]},
    '18.905': {'lectureRawSections': '32-141/MWF/0/10',
                'lectureSections': [[[[4, 2], [64, 2], [124, 2]], '32-141']]},
    '18.937': {'lectureRawSections': '66-144/TR/0/9.30-11',
                'lectureSections': [[[[33, 3], [93, 3]], '66-144']]},
    '18.950': {'lectureRawSections': '2-131/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-131']]},
    '18.9501': {'lectureRawSections': '2-131/TR/0/1-2.30',
                'lectureSections': [[[[40, 3], [100, 3]], '2-131']]},
    '18.965': {'lectureRawSections': '24-121/TR/0/11-12.30',
                'lectureSections': [[[[36, 3], [96, 3]], '24-121']]},
    '18.A11': {'lectureRawSections': '2-136/F/0/10-12',
                'lectureSections': [[[[124, 4]], '2-136']]},
    '18.A34': {'lectureRawSections': '2-136/MW/0/1',
                'lectureSections': [[[[10, 2], [70, 2]], '2-136']]},
    '18.C06': {'lectureRawSections': '45-230/MWF/0/11',
                'lectureSections': [[[[6, 2], [66, 2], [126, 2]], '45-230']]},
    '18.C20': {'lectureRawSections': '33-419/MW/0/3-4.30',
                'lectureSections': [[[[14, 3], [74, 3]], '33-419']]},
    '18.C25': {'lectureRawSections': '4-149/MW/0/1-2.30',
                'lectureSections': [[[[10, 3], [70, 3]], '4-149']]},

    "18.01": {
        "lectureRawSections": "10-250/TR/0/1/F/0/2",
        "lectureSections": [
            [[40, 2], [100, 2], [132, 2]],
            "10-250",
        ],
    },

    "18.701": {
        "lectureRawSections": "54-100/TR/0/1-2.30",
        "lectureSections": [
            [[40, 3], [100, 3]],
            "54-100",
        ],
    },
}


def run():
    """
    The main entry point.
    Takes data from fireroad.json and catalog.json; outputs latest.json.
    There are no arguments and no return value.
    """
    courses = dict()
    with open("fireroad.json") as f:
        fireroad = json.load(f)
    with open("catalog.json") as f:
        catalog = json.load(f)

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, we don't have its schedule.
    # If it's not in catalog, it's not offered this semester.
    for course in set(fireroad) & set(catalog):
        courses[course] = fireroad[course]
        courses[course].update(catalog[course])

    for course, info in OVERRIDES.items():
        if course in courses:
            courses[course].update(info)

    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    obj = {
        "termInfo": term_info,
        "lastUpdated": now,
        "classes": courses,
    }

    with open("../public/latest.json", "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    pass
    #run()
